const PALETTE = [
  "#8a8aff",
  "#ff8aa8",
  "#8affba",
  "#ffba8a",
  "#c08aff",
  "#8aceff",
  "#fff28a",
  "#ff8acf",
  "#a8ff8a",
  "#ffaa8a"
];

export function tagColor(tag: string): string {
  if (!tag) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export function intensityColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "#22222b";
  const ratio = Math.min(1, value / max);
  const alpha = 0.15 + ratio * 0.7;
  return `rgba(138, 138, 255, ${alpha.toFixed(2)})`;
}
