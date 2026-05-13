export interface PhysicsStar {
  x: number;
  y: number;
  r: number;
  rot: number;
  vx: number;
  vy: number;
}

// Cylinder jar geometry (4:3 h:w ratio)
// viewBox 320x490, CSS 320x420 → CSS scale = viewBox * 420/490
// Width 228, height 355 viewBox → CSS 228 x 304 ≈ 4:3
export const CYLINDER = {
  left: 46,
  right: 274,
  top: 50,
  bottom: 383,   // flat bottom Y
  floor: 405,     // bottom of rounded corner
  cornerR: 22,    // bottom corner radius
};

const PAD = 5;
const MAX_STEPS = 400;

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
  left: 46,
  right: 274,
  bottom: 383,
  floor: 405,
  neck: 50,
  gravity: 0.55,
  bounce: 0.35,
  friction: 0.85
};

export function settleNewStar(
  drop: { x: number; r: number },
  existing: { x: number; y: number; r: number }[],
  bounds: JarBounds = DEFAULT_BOUNDS
): { x: number; y: number; r: number; rot: number } {
  const star: PhysicsStar = {
    x: drop.x,
    y: CYLINDER.top + 25,
    r: drop.r,
    rot: 0,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 0,
  };

  for (let step = 0; step < MAX_STEPS; step++) {
    star.vy += bounds.gravity;
    star.vy *= 0.995;
    star.x += star.vx;
    star.y += star.vy;

    resolveCylinderCollision(star);

    for (const s of existing) {
      const dx = star.x - s.x;
      const dy = star.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = star.r + s.r + PAD;
      if (dist < minDist && dist > 0.01) {
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        star.x += nx * overlap * 0.85;
        star.y += ny * overlap * 0.85;
        const dot = star.vx * nx + star.vy * ny;
        if (dot < 0) {
          star.vx -= dot * nx * (1 + bounds.bounce);
          star.vy -= dot * ny * (1 + bounds.bounce);
          star.vx *= bounds.friction;
          star.vy *= bounds.friction;
        }
      }
    }

    if (Math.abs(star.vx) < 0.06 && Math.abs(star.vy) < 0.2 && step > 30) break;
  }

  return { x: star.x, y: star.y, r: star.r, rot: (Math.random() - 0.5) * 0.6 };
}

// ── Real-time physics ──

export function resolveCylinderCollision(s: PhysicsStar): void {
  const { left, right, top, bottom, floor, cornerR } = CYLINDER;

  // Straight side walls
  if (s.x - s.r < left) {
    s.x = left + s.r;
    if (s.vx < 0) s.vx = Math.abs(s.vx) * 0.25;
  }
  if (s.x + s.r > right) {
    s.x = right - s.r;
    if (s.vx > 0) s.vx = -Math.abs(s.vx) * 0.25;
  }

  // Top
  if (s.y - s.r < top) {
    s.y = top + s.r;
    if (s.vy < 0) s.vy = Math.abs(s.vy) * 0.25;
  }

  // Bottom with rounded corners
  if (s.y + s.r > bottom) {
    // Left corner zone
    if (s.x < left + cornerR) {
      const cx = left + cornerR;
      const cy = bottom;
      const dx = s.x - cx;
      const dy = s.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = cornerR - s.r;
      if (dist > maxDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        s.x = cx + nx * maxDist;
        s.y = cy + ny * maxDist;
        const dot = s.vx * nx + s.vy * ny;
        if (dot > 0) {
          s.vx -= dot * nx * 1.3;
          s.vy -= dot * ny * 1.3;
          s.vx *= 0.65;
          s.vy *= 0.65;
        }
      }
    }
    // Right corner zone
    else if (s.x > right - cornerR) {
      const cx = right - cornerR;
      const cy = bottom;
      const dx = s.x - cx;
      const dy = s.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = cornerR - s.r;
      if (dist > maxDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        s.x = cx + nx * maxDist;
        s.y = cy + ny * maxDist;
        const dot = s.vx * nx + s.vy * ny;
        if (dot > 0) {
          s.vx -= dot * nx * 1.3;
          s.vy -= dot * ny * 1.3;
          s.vx *= 0.65;
          s.vy *= 0.65;
        }
      }
    }
    // Flat bottom
    else {
      if (s.y + s.r > floor) {
        s.y = floor - s.r;
        if (s.vy > 0) s.vy = -Math.abs(s.vy) * 0.3;
        s.vx *= 0.8;
      }
    }
  }
}

export function resolveStarPairCollision(a: PhysicsStar, b: PhysicsStar): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = a.r + b.r + PAD;

  if (dist < minDist && dist > 0.001) {
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = minDist - dist;
    const half = overlap / 2;

    a.x -= nx * half;
    a.y -= ny * half;
    b.x += nx * half;
    b.y += ny * half;

    const relVx = a.vx - b.vx;
    const relVy = a.vy - b.vy;
    const dot = relVx * nx + relVy * ny;
    if (dot > 0) {
      a.vx -= dot * nx * 0.75;
      a.vy -= dot * ny * 0.75;
      b.vx += dot * nx * 0.75;
      b.vy += dot * ny * 0.75;
      a.vx *= 0.75;
      a.vy *= 0.75;
      b.vx *= 0.75;
      b.vy *= 0.75;
    }
  }
}

export function resolveAllStarCollisions(stars: PhysicsStar[]): void {
  for (let i = 0; i < stars.length; i++) {
    for (let j = i + 1; j < stars.length; j++) {
      resolveStarPairCollision(stars[i], stars[j]);
    }
  }
}

export function stepPhysics(
  stars: PhysicsStar[],
  gravityX: number,
  gravityY: number,
  dt: number
): void {
  const steps = Math.max(1, Math.round(dt));
  const subDt = dt / steps;

  for (let s = 0; s < steps; s++) {
    for (const star of stars) {
      star.vx += gravityX * subDt;
      star.vy += gravityY * subDt;
      star.vx *= 0.998;
      star.vy *= 0.998;
      star.x += star.vx * subDt;
      star.y += star.vy * subDt;
      resolveCylinderCollision(star);
    }
    resolveAllStarCollisions(stars);
  }
}

export function getDropX(_bounds: JarBounds = DEFAULT_BOUNDS): number {
  return CYLINDER.left + 20 + Math.random() * (CYLINDER.right - CYLINDER.left - 40);
}

export function getRandomR(): number {
  return 23 + Math.random() * 9;
}

export { DEFAULT_BOUNDS };
