export interface PhysicsStar {
  x: number;
  y: number;
  r: number;
  rot: number;
}

export interface JarBounds {
  left: number;
  right: number;
  bottom: number;
  floor: number;
  neck: number;
  gravity: number;
  bounce: number;
  friction: number;
}

const DEFAULT_BOUNDS: JarBounds = {
  left: 42,
  right: 258,
  bottom: 310,
  floor: 314,
  neck: 120,
  gravity: 0.55,
  bounce: 0.35,
  friction: 0.85
};

const PAD = 8;
const MAX_STEPS = 320;

export function settleNewStar(
  drop: { x: number; r: number },
  existing: PhysicsStar[],
  bounds: JarBounds = DEFAULT_BOUNDS
): PhysicsStar {
  let x = drop.x;
  let y = bounds.neck + 10;
  const r = drop.r;
  let vx = (Math.random() - 0.5) * 1.2;
  let vy = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    vy += bounds.gravity;
    vy *= 0.995;
    x += vx;
    y += vy;

    let curveWidth = bounds.right - bounds.left;
    if (y > bounds.bottom - 40) {
      const t = Math.max(0, (bounds.bottom - y) / 40);
      curveWidth = (bounds.right - bounds.left) * (0.70 + 0.30 * t);
    }
    const cx = (bounds.left + bounds.right) / 2;
    const wallL = cx - curveWidth / 2 + r + 2;
    const wallR = cx + curveWidth / 2 - r - 2;

    if (x < wallL) { x = wallL; vx = Math.abs(vx) * bounds.bounce; }
    if (x > wallR) { x = wallR; vx = -Math.abs(vx) * bounds.bounce; }

    if (y + r > bounds.floor) {
      y = bounds.floor - r;
      vy = -vy * bounds.bounce;
      vx *= bounds.friction;
      if (Math.abs(vy) < 0.6) vy = 0;
    }

    for (const s of existing) {
      const dx = x - s.x;
      const dy = y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = r + s.r + PAD;
      if (dist < minDist && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        x += nx * overlap * 0.85;
        y += ny * overlap * 0.85;
        const dot = vx * nx + vy * ny;
        if (dot < 0) {
          vx -= dot * nx * (1 + bounds.bounce);
          vy -= dot * ny * (1 + bounds.bounce);
          vx *= bounds.friction;
          vy *= bounds.friction;
        }
      }
    }

    if (Math.abs(vx) < 0.06 && Math.abs(vy) < 0.2 && step > 30) break;
  }

  return {
    x,
    y,
    r,
    rot: (Math.random() - 0.5) * 0.6
  };
}

export function getDropX(bounds: JarBounds = DEFAULT_BOUNDS): number {
  return bounds.left + 40 + Math.random() * (bounds.right - bounds.left - 80);
}

export function getRandomR(): number {
  return 25 + Math.random() * 10;
}

export { DEFAULT_BOUNDS };
