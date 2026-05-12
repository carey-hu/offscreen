import { WhiteNoiseTrack } from "../types";

type AudioStatus = {
  isPlaying: boolean;
  currentTrackId: string | null;
  volume: number;
};

class AudioController {
  private audio: HTMLAudioElement;
  private currentTrackId: string | null = null;
  private listeners: ((status: AudioStatus) => void)[] = [];
  private volume: number = 0.5;

  constructor() {
    this.audio = new Audio();
    this.audio.loop = true;
    this.audio.volume = this.volume;

    this.audio.onplay = () => this.notify();
    this.audio.onpause = () => this.notify();
    this.audio.onended = () => this.notify();
    this.audio.onerror = () => {
      console.error("Audio playback error");
      this.currentTrackId = null;
      this.notify();
    };
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
      isPlaying: !this.audio.paused && this.audio.readyState > 0,
      currentTrackId: this.currentTrackId,
      volume: this.volume
    };
  }

  play(track: WhiteNoiseTrack) {
    if (this.currentTrackId === track.id) {
      if (this.audio.paused) {
        this.audio.play().catch(console.error);
      }
      return;
    }

    this.audio.pause();
    this.audio.src = track.url;
    this.audio.load();
    this.audio.play().catch(console.error);
    this.currentTrackId = track.id;
    this.notify();
  }

  pause() {
    this.audio.pause();
    this.notify();
  }

  stop() {
    this.audio.pause();
    this.audio.src = "";
    this.currentTrackId = null;
    this.notify();
  }

  setVolume(volume: number) {
    this.volume = volume;
    this.audio.volume = volume;
    this.notify();
  }

  getCurrentTrackId() {
    return this.currentTrackId;
  }

  isPlaying() {
    return !this.audio.paused;
  }
}

export const audioController = new AudioController();

export const WHITE_NOISE_TRACKS: WhiteNoiseTrack[] = [
  {
    id: "rain",
    name: "雨声",
    icon: "CloudRain",
    url: "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3"
  },
  {
    id: "forest",
    name: "森林",
    icon: "Trees",
    url: "https://assets.mixkit.co/active_storage/sfx/131/131-preview.mp3"
  },
  {
    id: "cafe",
    name: "咖啡馆",
    icon: "Coffee",
    url: "https://assets.mixkit.co/active_storage/sfx/2405/2405-preview.mp3"
  },
  {
    id: "fire",
    name: "篝火",
    icon: "Flame",
    url: "https://assets.mixkit.co/active_storage/sfx/2443/2443-preview.mp3"
  }
];
