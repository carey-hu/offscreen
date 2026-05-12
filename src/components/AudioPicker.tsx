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
    if (status.currentTrackId === track.id && status.isPlaying) {
      audioController.pause();
    } else {
      audioController.play(track);
    }
  };

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ambient Sound</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={status.volume}
            onChange={(e) => audioController.setVolume(parseFloat(e.target.value))}
            className="h-1 w-16 accent-white"
          />
          {status.isPlaying ? (
            <Volume2 size={14} className="animate-pulse text-white" />
          ) : (
            <VolumeX size={14} className="text-gray-600" />
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
                  ? "scale-105 bg-white text-black"
                  : isActive
                  ? "bg-gray-800 text-white"
                  : "bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[8px] font-black uppercase">{track.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
