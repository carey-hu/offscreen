import { useEffect, useRef } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
}

export function WheelPicker({ value, onChange, max, label }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = Array.from({ length: max + 1 }, (_, i) => i);

  useEffect(() => {
    if (scrollRef.current) {
      const itemHeight = 40;
      scrollRef.current.scrollTop = value * itemHeight;
    }
  }, []);

  const handleScroll = () => {
    if (scrollRef.current) {
      const itemHeight = 40;
      const newValue = Math.round(scrollRef.current.scrollTop / itemHeight);
      if (newValue !== value && newValue >= 0 && newValue <= max) {
        onChange(newValue);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[120px] overflow-y-auto no-scrollbar snap-y snap-mandatory px-4"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="h-[40px]" />
        {items.map((item) => (
          <div
            key={item}
            className={`h-[40px] flex items-center justify-center snap-center transition-all ${
              value === item
                ? "text-4xl font-black text-primary"
                : "text-2xl font-bold text-faint opacity-30"
            }`}
          >
            {item.toString().padStart(2, "0")}
          </div>
        ))}
        <div className="h-[40px]" />
      </div>
      <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-faint">
        {label}
      </span>
    </div>
  );
}
