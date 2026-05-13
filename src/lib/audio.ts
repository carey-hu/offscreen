import { WhiteNoiseTrack } from "../types";

type AudioStatus = {
  isPlaying: boolean;
  currentTrackId: string | null;
  volume: number;
  source: "audio" | "procedural" | "none";
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
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.18;
      b6 = white * 0.115926;
    }
  } else {
    // brown — integrated white, normalized to ~±0.6
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 1.6;
    }
  }

  return buffer;
}

interface ProceduralRecipe {
  color: NoiseColor;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
  gain: number;
}

const PROCEDURAL: Record<string, ProceduralRecipe> = {
  rain:   { color: "pink",  filterType: "highpass", filterFreq: 1000, filterQ: 0.7, gain: 1.4 },
  forest: { color: "pink",  filterType: "bandpass", filterFreq: 800,  filterQ: 0.5, gain: 1.5 },
  cafe:   { color: "brown",                                                          gain: 1.4 },
  fire:   { color: "white", filterType: "lowpass",  filterFreq: 2800, filterQ: 1.0, gain: 1.6 }
};

// CDN ambient loops — tried in order; if all fail (or timeout), procedural fallback.
// Drop your own .mp3 files into /public/sounds/ for the best experience.
const REMOTE_URLS: Record<string, string[]> = {
  rain: [
    "/sounds/rain.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3",
    "https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3"
  ],
  forest: [
    "/sounds/forest.mp3",
    "https://cdn.pixabay.com/download/audio/2021/10/25/audio_d0c1b07d97.mp3",
    "https://cdn.pixabay.com/download/audio/2022/05/16/audio_f01b83e976.mp3"
  ],
  cafe: [
    "/sounds/cafe.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c82dd0ab84.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/10/audio_e54fe65ca5.mp3"
  ],
  fire: [
    "/sounds/fire.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c42d02b4a8.mp3",
    "https://cdn.pixabay.com/download/audio/2021/08/09/audio_a29f03b0ec.mp3"
  ]
};

function tryLoadAudio(url: string, timeoutMs = 4000): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.loop = true;

    let settled = false;
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("error", onErr);
    };
    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(audio);
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("load failed"));
    };

    audio.addEventListener("canplaythrough", onReady);
    audio.addEventListener("loadedmetadata", onReady);
    audio.addEventListener("error", onErr);

    audio.src = url;
    audio.load();

    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        reject(new Error("timeout"));
      }
    }, timeoutMs);
  });
}

class AudioController {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private procNodes: AudioNode[] = [];
  private htmlAudio: HTMLAudioElement | null = null;

  private currentTrackId: string | null = null;
  private isPlayingFlag = false;
  private source: AudioStatus["source"] = "none";
  private listeners: ((s: AudioStatus) => void)[] = [];
  private volume = 0.5;
  private loadingTrackId: string | null = null;
  private playToken = 0;

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!Ctor) throw new Error("Web Audio API not supported");
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
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
      volume: this.volume,
      source: this.source
    };
  }

  async play(track: WhiteNoiseTrack) {
    // Toggle off if same track is already playing
    if (this.currentTrackId === track.id && this.isPlayingFlag) {
      this.stop();
      return;
    }

    this.teardownAll();
    const token = ++this.playToken;
    this.loadingTrackId = track.id;
    this.currentTrackId = track.id;
    this.notify();

    const urls = REMOTE_URLS[track.id] ?? [];

    for (const url of urls) {
      try {
        const audio = await tryLoadAudio(url);
        if (this.playToken !== token) { audio.pause(); return; }
        audio.volume = this.volume;
        await audio.play();
        if (this.playToken !== token) { audio.pause(); return; }
        this.htmlAudio = audio;
        this.source = "audio";
        this.isPlayingFlag = true;
        this.loadingTrackId = null;
        this.notify();
        return;
      } catch {
        // try next url
      }
    }

    // All URLs failed → fall back to procedural noise
    try {
      const ctx = this.ensureCtx();
      if (ctx.state !== "running") {
        await ctx.resume();
      }
      if (this.playToken !== token) return;

      const recipe = PROCEDURAL[track.id] ?? { color: "pink", gain: 1.5 };
      const buffer = createNoiseBuffer(ctx, 2, recipe.color);
      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = true;

      const trackGain = ctx.createGain();
      trackGain.gain.value = recipe.gain;

      if (recipe.filterType) {
        const filter = ctx.createBiquadFilter();
        filter.type = recipe.filterType;
        filter.frequency.value = recipe.filterFreq ?? 1000;
        filter.Q.value = recipe.filterQ ?? 0.7;
        sourceNode.connect(filter);
        filter.connect(trackGain);
        this.procNodes.push(filter);
      } else {
        sourceNode.connect(trackGain);
      }

      trackGain.connect(this.masterGain!);
      sourceNode.start();

      if (this.playToken !== token) { this.teardownAll(); return; }

      this.procNodes.push(sourceNode, trackGain);
      this.source = "procedural";
      this.isPlayingFlag = true;
      this.loadingTrackId = null;
      this.notify();
    } catch (err) {
      console.error("Audio fallback failed", err);
      this.source = "none";
      this.isPlayingFlag = false;
      this.currentTrackId = null;
      this.loadingTrackId = null;
      this.notify();
    }
  }

  pause() {
    this.teardownAll();
    this.isPlayingFlag = false;
    this.source = "none";
    this.notify();
  }

  stop() {
    this.teardownAll();
    this.currentTrackId = null;
    this.isPlayingFlag = false;
    this.source = "none";
    this.loadingTrackId = null;
    this.notify();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
    if (this.htmlAudio) this.htmlAudio.volume = this.volume;
    this.notify();
  }

  private teardownAll() {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.src = "";
        this.htmlAudio.load();
      } catch {
        /* ignore */
      }
      this.htmlAudio = null;
    }
    this.procNodes.forEach((node) => {
      try {
        if ("stop" in node && typeof (node as AudioBufferSourceNode).stop === "function") {
          (node as AudioBufferSourceNode).stop();
        }
      } catch {
        /* ignore */
      }
      try {
        node.disconnect();
      } catch {
        /* ignore */
      }
    });
    this.procNodes = [];
  }
}

export const audioController = new AudioController();

export const WHITE_NOISE_TRACKS: WhiteNoiseTrack[] = [
  { id: "rain",   name: "雨声",     icon: "CloudRain", url: "" },
  { id: "forest", name: "森林",     icon: "Trees",     url: "" },
  { id: "cafe",   name: "咖啡馆",   icon: "Coffee",    url: "" },
  { id: "fire",   name: "篝火",     icon: "Flame",     url: "" }
];
