// Apple-style semantic color palette — works in both light and dark modes
const APPLE_PALETTE = [
  "#0A84FF", // blue
  "#5E5CE6", // indigo
  "#BF5AF2", // purple
  "#FF375F", // pink
  "#FF453A", // red
  "#FF9F0A", // orange
  "#FFD60A", // yellow
  "#30D158", // green
  "#00C7BE", // mint
  "#40C8E0", // teal
  "#AC8E68"  // brown
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Stable color per task — hashed by task.id so renaming the title / tag
// keeps the same color, and different tasks (even with the same tag) differ.
export function taskColor(taskId: string): string {
  if (!taskId) return APPLE_PALETTE[0];
  return APPLE_PALETTE[hashString(taskId) % APPLE_PALETTE.length];
}

// Used by stats / charts / history where rows share a color by tag.
export function tagColor(tag: string): string {
  if (!tag) return APPLE_PALETTE[0];
  return APPLE_PALETTE[hashString(tag) % APPLE_PALETTE.length];
}

export function intensityColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "#22222b";
  const ratio = Math.min(1, value / max);
  const alpha = 0.15 + ratio * 0.7;
  return `rgba(138, 138, 255, ${alpha.toFixed(2)})`;
}
