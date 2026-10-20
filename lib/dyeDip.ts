/**
 * Dye-dip mask, ported from snug-rack-lab.html `pickColour`: the new colourway wicks up from the
 * hem behind a wavy edge, with a few "fingers" of dye running ahead of it. The prototype worked in
 * a 1000×1250 box; every length here is scaled to the photo's own pixel size (w×h).
 */
export type Finger = { x: number; w: number; h: number; d: number };

export const DIP_MS = 1150;

export function makeFingers(w: number): Finger[] {
  const k = w / 1000;
  return [...Array(7)].map((_, i) => ({
    x: (90 + i * 130 + Math.random() * 60) * k,
    w: (16 + Math.random() * 22) * k,
    h: (40 + Math.random() * 90) * k,
    d: Math.random() * 0.25,
  }));
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Mask path at time `t` (0..1) of the dip; `now` (ms) drives the ripple. */
export function dipPath(t: number, now: number, w: number, h: number, fingers: Finger[]) {
  const k = w / 1000;
  const e = ease(t);
  const ph = now / 180;
  const y0 = h + 60 * k - (h + 200 * k) * e;
  const amp = 26 * k * (1 - e * 0.6);
  let d = `M0 ${h + 10} L0 ${y0}`;
  for (let x = 0; x <= w; x += 25 * k) {
    d += ` L${x.toFixed(1)} ${(y0 + Math.sin(x / (90 * k) + ph) * amp + Math.sin(x / (37 * k) - ph * 1.3) * amp * 0.35).toFixed(1)}`;
  }
  d += ` L${w} ${h + 10}Z`;
  for (const f of fingers) {
    const g = Math.max(0, Math.min(1, (e - f.d) * 3)) * (1 - e) * 1.4;
    if (g <= 0) continue;
    const top = y0 - f.h * g;
    const r = f.w / 2;
    d += ` M${f.x - r} ${y0 + 20 * k} L${f.x - r} ${top + r} A${r} ${r} 0 0 1 ${f.x + r} ${top + r} L${f.x + r} ${y0 + 20 * k}Z`;
  }
  return d;
}

/** 9% of a colourway mixed into the wall colour (prototype `mix`). */
export function tint(hex: string, paper = "#e9e8e4") {
  const a = [1, 3, 5].map((i) => parseInt(paper.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgb(${a.map((v, i) => Math.round(v * 0.91 + b[i] * 0.09)).join(",")})`;
}

/** Readable label colour on a swatch. */
export function inkOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#151513" : "#ecebe6";
}
