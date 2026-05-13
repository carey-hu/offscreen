import { WhiteNoiseTrack } from "../types";

type AudioStatus = {
  isPlaying: boolean;
  currentTrackId: string | null;
  volume: number;
};

type NoiseColor = "white" | "pink" | "brown";

function createNoiseBuffer(
  ctx: AudioContext,
  durationSeconds: number,
  color: NoiseColor
): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  } else if (color === "pink") {
    // Voss-McCartney approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    // brown — integrated white
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }

  return buffer;
}

interface TrackRecipe {
  color: NoiseColor;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
  gain: number;
}

const RECIPES: Record<string, TrackRecipe> = {
  rain:   { color: "pink",  filterType: "highpass", filterFreq: 900,  filterQ: 0.7, gain: 0.95 },
  forest: { color: "pink",  filterType: "bandpass", filterFreq: 600,  filterQ: 0.5, gain: 1.4 },
  cafe:   { color: "brown",                                                          gain: 1.0 },
  fire:   { color: "pink",  filterType: "lowpass",  filterFreq: 700,  filterQ: 0.7, gain: 1.6 }
};

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private currentTrackId: string | null = null;
  private isPlayingFlag = false;
  private listeners: ((s: AudioStatus) => void)[] = [];
  private volume = 0.5;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        (window.AudioContext || (window as any).webkitAudioContext) as
          | typeof AudioContext
          | undefined;
      if (!Ctor) {
        throw new Error("Web Audio API not supported");
      }
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private notify() {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  subscribe(listener: (status: AudioStatus) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  getStatus(): AudioStatus {
    return {
      isPlaying: this.isPlayingFlag,
      currentTrackId: this.currentTrackId,
      volume: this.volume
    };
  }

  play(track: WhiteNoiseTrack) {
    try {
      // Toggle off if same track is playing
      if (this.currentTrackId === track.id && this.isPlayingFlag) {
        this.pause();
        return;
      }

      this.teardownNodes();
      const ctx = this.ensureCtx();
      const recipe = RECIPES[track.id] ?? { color: "pink", gain: 1 };

      const buffer = createNoiseBuffer(ctx, 2, recipe.color);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const trackGain = ctx.createGain();
      trackGain.gain.value = recipe.gain;

      let lastNode: AudioNode = source;
      if (recipe.filterType) {
        const filter = ctx.createBiquadFilter();
        filter.type = recipe.filterType;
        filter.frequency.value = recipe.filterFreq ?? 1000;
        filter.Q.value = recipe.filterQ ?? 0.7;
        source.connect(filter);
        filter.connect(trackGain);
        this.activeNodes.push(filter);
        lastNode = trackGain;
      } else {
        source.connect(trackGain);
        lastNode = trackGain;
      }

      lastNode.connect(this.masterGain!);
      source.start();

      this.activeNodes.push(source, trackGain);
      this.currentTrackId = track.id;
      this.isPlayingFlag = true;
      this.notify();
    } catch (err) {
      console.error("Audio play failed", err);
      this.isPlayingFlag = false;
      this.currentTrackId = null;
      this.notify();
    }
  }

  pause() {
    this.teardownNodes();
    this.isPlayingFlag = false;
    this.notify();
  }

  stop() {
    this.teardownNodes();
    this.currentTrackId = null;
    this.isPlayingFlag = false;
    this.notify();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    this.notify();
  }

  private teardownNodes() {
    this.activeNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as AudioBufferSourceNode).stop === "function") {
          (node as AudioBufferSourceNode).stop();
        }
      } catch {
        /* may have already stopped */
      }
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.activeNodes = [];
  }
}

export const audioController = new AudioController();

export const WHITE_NOISE_TRACKS: WhiteNoiseTrack[] = [
  { id: "rain",   name: "雨声",     icon: "CloudRain", url: "procedural:rain" },
  { id: "forest", name: "森林",     icon: "Trees",     url: "procedural:forest" },
  { id: "cafe",   name: "咖啡馆",   icon: "Coffee",    url: "procedural:cafe" },
  { id: "fire",   name: "篝火",     icon: "Flame",     url: "procedural:fire" }
];
