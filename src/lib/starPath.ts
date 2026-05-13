export function makeStarPath(cx: number, cy: number, r: number, rot = 0): string {
  const outer = r;
  const inner = r * 0.42;
  let d = "";
  for (let i = 0; i < 10; i++) {
    const ang = Math.PI / 2 - (i * Math.PI) / 5 + rot;
    const rad = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(ang) * rad;
    const y = cy - Math.sin(ang) * rad;
    d += (i === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d + "Z";
}
