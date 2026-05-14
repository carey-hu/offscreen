import { useEffect, useRef } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
  max: number;
  label: string;
}

const ITEM_HEIGHT = 40;

export function WheelPicker({ value, onChange, max, label }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Sentinel of -1 ensures the first effect run syncs to the initial value.
  const lastReportedRef = useRef<number>(-1);
  const items = Array.from({ length: max + 1 }, (_, i) => i);

  // Sync scroll position whenever `value` changes externally (e.g. mode switch
  // bumping the default minutes). Skip when the change originated from user
  // scroll so we don't fight the scroll inertia.
  useEffect(() => {
    if (!scrollRef.current) return;
    if (lastReportedRef.current === value) return;
    scrollRef.current.scrollTop = value * ITEM_HEIGHT;
    lastReportedRef.current = value;
  }, [value]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const newValue = Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
    if (newValue !== value && newValue >= 0 && newValue <= max) {
      lastReportedRef.current = newValue;
      onChange(newValue);
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
