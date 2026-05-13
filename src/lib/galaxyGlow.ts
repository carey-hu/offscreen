const STAR_CAPACITY = 80;

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
      core: { opacity: 0, rx: 55, ry: 50 },
      mid: { opacity: 0, rx: 85, ry: 80 },
      outer: { opacity: 0, rx: 110, ry: 100 },
      halo: { opacity: 0, rx: 135, ry: 115 },
      inner: { opacity: 0 },
      level: "沉睡中"
    };
  }
  const t = Math.min(total / STAR_CAPACITY, 1);
  return {
    core: { opacity: 0.25 + t * 0.6, rx: 55 + t * 20, ry: 50 + t * 18 },
    mid: { opacity: 0.15 + t * 0.55, rx: 85 + t * 30, ry: 80 + t * 25 },
    outer: { opacity: 0.10 + t * 0.45, rx: 110 + t * 40, ry: 100 + t * 35 },
    halo: { opacity: 0.05 + t * 0.35, rx: 135 + t * 50, ry: 115 + t * 40 },
    inner: { opacity: 0.20 + t * 0.55 },
    level: levelOf(total)
  };
}

function levelOf(n: number): string {
  if (n === 0) return "沉睡中";
  if (n < 5) return "微光初现";
  if (n < 15) return "渐渐变亮";
  if (n < 35) return "温暖发光";
  if (n < 60) return "熠熠生辉";
  return "星河璀璨";
}
