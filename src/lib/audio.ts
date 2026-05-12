import { WhiteNoiseTrack } from "./types";

class AudioController {
  private audio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;

  play(track: WhiteNoiseTrack) {
    if (this.currentTrackId === track.id && this.audio) {
      this.audio.play();
      return;
    }

    if (this.audio) {
      this.audio.pause();
    }

    this.audio = new Audio(track.url);
    this.audio.loop = true;
    this.audio.play();
    this.currentTrackId = track.id;
  }

  pause() {
    this.audio?.pause();
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
      this.currentTrackId = null;
    }
  }

  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = volume;
    }
  }

  isPlaying() {
    return this.audio ? !this.audio.paused : false;
  }

  getCurrentTrackId() {
    return this.currentTrackId;
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
