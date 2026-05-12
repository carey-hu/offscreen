import { CloudRain, Trees, Coffee, Flame, Music2, Volume2, VolumeX } from "lucide-react";
import { audioController, WHITE_NOISE_TRACKS } from "../lib/audio";
import { useState } from "react";

const iconMap: Record<string, any> = {
  CloudRain,
  Trees,
  Coffee,
  Flame
};

export function AudioPicker() {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(audioController.getCurrentTrackId());
  const [isPlaying, setIsPlaying] = useState(audioController.isPlaying());

  const toggleTrack = (track: typeof WHITE_NOISE_TRACKS[0]) => {
    if (activeTrackId === track.id) {
      if (isPlaying) {
        audioController.pause();
        setIsPlaying(false);
      } else {
        audioController.play(track);
        setIsPlaying(true);
      }
    } else {
      audioController.play(track);
      setActiveTrackId(track.id);
      setIsPlaying(true);
    }
  };

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 size={16} className="text-gray-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ambient Sound</span>
        </div>
        {isPlaying ? <Volume2 size={14} className="text-white animate-pulse" /> : <VolumeX size={14} className="text-gray-600" />}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {WHITE_NOISE_TRACKS.map((track) => {
          const Icon = iconMap[track.icon];
          const isActive = activeTrackId === track.id;

          return (
            <button
              key={track.id}
              onClick={() => toggleTrack(track)}
              className={`flex flex-col items-center gap-2 rounded-2xl py-3 transition-all ${
                isActive && isPlaying
                  ? "bg-white text-black scale-105"
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
