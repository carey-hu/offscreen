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

export function makeRoundedStarPath(cx: number, cy: number, r: number, rot = 0): string {
  const outerR = r;
  const innerR = r * 0.42;
  const points: [number, number][] = [];

  for (let i = 0; i < 5; i++) {
    const tipAngle = Math.PI / 2 + i * (2 * Math.PI) / 5 + rot;

    // Rounded tip: 3 points forming a soft cap
    const spread = 0.1;
    points.push([
      cx + Math.cos(tipAngle - spread) * outerR * 0.96,
      cy - Math.sin(tipAngle - spread) * outerR * 0.96
    ]);
    points.push([
      cx + Math.cos(tipAngle) * outerR,
      cy - Math.sin(tipAngle) * outerR
    ]);
    points.push([
      cx + Math.cos(tipAngle + spread) * outerR * 0.96,
      cy - Math.sin(tipAngle + spread) * outerR * 0.96
    ]);

    // Valley
    const valleyAngle = tipAngle + Math.PI / 5;
    points.push([
      cx + Math.cos(valleyAngle) * innerR,
      cy - Math.sin(valleyAngle) * innerR
    ]);
  }

  return points.map(([px, py], i) =>
    (i === 0 ? "M" : "L") + px.toFixed(1) + " " + py.toFixed(1)
  ).join(" ") + " Z";
}
