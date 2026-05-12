import { CloudRain, Trees, Coffee, Flame, Music2, Volume2, VolumeX } from "lucide-react";
1	import { audioController, WHITE_NOISE_TRACKS } from "../lib/audio";
2	import { useEffect, useState } from "react";
3
4	const iconMap: Record<string, any> = {
5	  CloudRain,
6	  Trees,
7	  Coffee,
8	  Flame
9	};
10
11	export function AudioPicker() {
12	  const [status, setStatus] = useState(audioController.getStatus());
13
14	  useEffect(() => {
15	    const unsubscribe = audioController.subscribe((newStatus) => {
16	      setStatus(newStatus);
17	    });
18	    return unsubscribe;
19	  }, []);
20
21	  const toggleTrack = (track: typeof WHITE_NOISE_TRACKS[0]) => {
22	    if (status.currentTrackId === track.id && status.isPlaying) {
23	      audioController.pause();
24	    } else {
25	      audioController.play(track);
26	    }
27	  };
28
29	  return (
30	    <div className="mt-6 border-t border-white/5 pt-6">
31	      <div className="mb-4 flex items-center justify-between">
32	        <div className="flex items-center gap-2">
33	          <Music2 size={16} className="text-gray-500" />
34	          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Ambient Sound</span>
35	        </div>
36	        <div className="flex items-center gap-3">
37	          <input
38	            type="range"
39	            min="0"
40	            max="1"
41	            step="0.01"
42	            value={status.volume}
43	            onChange={(e) => audioController.setVolume(parseFloat(e.target.value))}
44	            className="h-1 w-16 accent-white"
45	          />
46	          {status.isPlaying ? (
47	            <Volume2 size={14} className="animate-pulse text-white" />
48	          ) : (
49	            <VolumeX size={14} className="text-gray-600" />
50	          )}
51	        </div>
52	      </div>
53
54	      <div className="grid grid-cols-4 gap-3">
55	        {WHITE_NOISE_TRACKS.map((track) => {
56	          const Icon = iconMap[track.icon];
57	          const isActive = status.currentTrackId === track.id;
58	          const isCurrentlyPlaying = isActive && status.isPlaying;
59
60	          return (
61	            <button
62	              key={track.id}
63	              onClick={() => toggleTrack(track)}
64	              className={`flex flex-col items-center gap-2 rounded-2xl py-3 transition-all ${
65	                isCurrentlyPlaying
66	                  ? "scale-105 bg-white text-black"
67	                  : isActive
68	                  ? "bg-gray-800 text-white"
69	                  : "bg-gray-900 text-gray-500 hover:bg-gray-800 hover:text-gray-300"
70	              }`}
71	            >
72	              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
73	              <span className="text-[8px] font-black uppercase">{track.name}</span>
74	            </button>
75	          );
76	        })}
77	      </div>
78	    </div>
79	  );
80	}
