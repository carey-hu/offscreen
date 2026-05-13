import { useEffect, useRef, useState } from "react";
import { PhysicsStar, stepPhysics } from "../lib/physics";
import { StarPosition } from "../types";

interface UseJarPhysicsInput {
  entries: { id: string; position?: StarPosition }[];
  enabled: boolean;
}

export function useJarPhysics({ entries, enabled }: UseJarPhysicsInput) {
  const starsRef = useRef<Map<string, PhysicsStar>>(new Map());
  const gravityRef = useRef({ x: 0, y: 0.5 });
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [positions, setPositions] = useState<Map<string, PhysicsStar>>(new Map());

  // Sync entries into physics world
  useEffect(() => {
    const current = starsRef.current;

    // Remove stars whose entry is gone or no longer has a position
    for (const [id] of current) {
      const entry = entries.find((e) => e.id === id);
      if (!entry || !entry.position) {
        current.delete(id);
      }
    }

    // Add new stars (entry has position but not yet in physics world)
    for (const e of entries) {
      if (e.position && !current.has(e.id)) {
        current.set(e.id, {
          x: e.position.x,
          y: e.position.y,
          r: e.position.r,
          rot: e.position.rot,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0,
        });
      }
    }
  }, [entries]);

  // Physics loop
  useEffect(() => {
    if (!enabled) return;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(50, now - lastTimeRef.current);
      lastTimeRef.current = now;
      const stars = [...starsRef.current.values()];
      if (stars.length > 0) {
        stepPhysics(stars, gravityRef.current.x, gravityRef.current.y, dt * 0.06);
        // Clone to trigger re-render
        setPositions(new Map(starsRef.current));
      }
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [enabled]);

  // Device motion for gravity
  useEffect(() => {
    if (!enabled) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const g = e.accelerationIncludingGravity;
      if (g && g.x !== null && g.y !== null && g.z !== null) {
        gravityRef.current = {
          x: (g.x ?? 0) * 0.12,
          y: 0.5 + (g.z ?? 9.8) * 0.04,
        };
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma: left-right tilt (-90 to 90)
        // beta: front-back tilt (-180 to 180)
        gravityRef.current = {
          x: (e.gamma ?? 0) * 0.03,
          y: 0.5 + (e.beta ?? 0) * 0.01,
        };
      }
    };

    // Try DeviceMotion first (more accurate), fall back to DeviceOrientation
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [enabled]);

  // Mouse tilt for desktop
  useEffect(() => {
    if (!enabled) return;

    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      gravityRef.current = {
        x: ((e.clientX - cx) / cx) * 0.35,
        y: 0.5 + ((e.clientY - cy) / cy) * 0.2,
      };
    };

    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [enabled]);

  // For each entry, return the live physics position (or fall back to stored position)
  function getStarPosition(entryId: string, storedPos?: StarPosition) {
    const live = starsRef.current.get(entryId);
    if (live) return live;
    if (storedPos) return { x: storedPos.x, y: storedPos.y, r: storedPos.r, rot: storedPos.rot, vx: 0, vy: 0 };
    return null;
  }

  return { positions, getStarPosition };
}
