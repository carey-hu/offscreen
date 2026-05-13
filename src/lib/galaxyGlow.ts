const STAR_CAPACITY = 20;

export interface GalaxyGlow {
  core: { opacity: number; rx: number; ry: number };
  mid: { opacity: number; rx: number; ry: number };
  outer: { opacity: number; rx: number; ry: number };
  halo: { opacity: number; rx: number; ry: number };
  inner: { opacity: number };
  level: string;
}

export function computeGalaxyGlow(total: number): GalaxyGlow {
  if (total === 0) {
    return {
      core: { opacity: 0, rx: 50, ry: 45 },
      mid: { opacity: 0, rx: 80, ry: 70 },
      outer: { opacity: 0, rx: 105, ry: 90 },
      halo: { opacity: 0, rx: 130, ry: 105 },
      inner: { opacity: 0 },
      level: "沉睡中"
    };
  }
  const t = Math.min(total / STAR_CAPACITY, 1);
  return {
    core: { opacity: 0.3 + t * 0.55, rx: 50 + t * 30, ry: 45 + t * 28 },
    mid: { opacity: 0.18 + t * 0.5, rx: 80 + t * 40, ry: 70 + t * 35 },
    outer: { opacity: 0.12 + t * 0.4, rx: 105 + t * 50, ry: 90 + t * 45 },
    halo: { opacity: 0.06 + t * 0.32, rx: 130 + t * 60, ry: 105 + t * 50 },
    inner: { opacity: 0.25 + t * 0.5 },
    level: levelOf(total)
  };
}

function levelOf(n: number): string {
  if (n === 0) return "沉睡中";
  if (n < 3) return "微光初现";
  if (n < 8) return "渐渐变亮";
  if (n < 14) return "温暖发光";
  if (n < 18) return "熠熠生辉";
  return "星河璀璨";
}
