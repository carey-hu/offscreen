import { CloudRain, Trees, Coffee, Flame, Music2, Volume2, VolumeX } from "lucide-react";
import { audioController, WHITE_NOISE_TRACKS } from "../lib/audio";
import { useEffect, useState } from "react";

const iconMap: Record<string, any> = {
  CloudRain,
  Trees,
  Coffee,
  Flame
};

export function AudioPicker() {
  const [status, setStatus] = useState(audioController.getStatus());

  useEffect(() => {
    const unsubscribe = audioController.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  const toggleTrack = (track: typeof WHITE_NOISE_TRACKS[0]) => {
    audioController.play(track);
  };

  return (
    <div className="mt-6 border-t border-subtle pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-muted" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
            Ambient Sound
          </span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={status.volume}
            onChange={(e) => audioController.setVolume(parseFloat(e.target.value))}
            className="h-1 w-16 accent-indigo-400"
          />
          {status.isPlaying ? (
            <Volume2 size={14} className="animate-pulse text-indigo-400" />
          ) : (
            <VolumeX size={14} className="text-faint" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {WHITE_NOISE_TRACKS.map((track) => {
          const Icon = iconMap[track.icon];
          const isActive = status.currentTrackId === track.id;
          const isCurrentlyPlaying = isActive && status.isPlaying;

          return (
            <button
              key={track.id}
              onClick={() => toggleTrack(track)}
              className={`flex flex-col items-center gap-2 rounded-2xl py-3 transition-all ${
                isCurrentlyPlaying
                  ? "scale-105 bg-indigo-500 text-white shadow-lg"
                  : isActive
                  ? "bg-surface-hover text-primary"
                  : "bg-surface text-muted hover:bg-surface-hover hover:text-primary"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-black uppercase">{track.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
