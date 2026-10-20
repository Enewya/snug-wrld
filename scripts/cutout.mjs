// Prepares the garment photos in public/products/ for the rack.
//
//   node scripts/cutout.mjs        (macOS 14+, needs ffmpeg + swift on PATH)
//
// - -side / -front photos are shot on an opaque studio grey. Their alpha is the per-pixel max of
//   (a) Apple Vision's subject mask (scripts/lift.swift), which keeps white garments whole where
//   their shading matches the backdrop, and (b) a flood fill of the backdrop from the image border
//   with a soft 2px edge, which keeps thin details like the hook crisp.
//   Output: public/products/cut/<file>.png. Originals are never modified.
// - -back photos already have alpha and are used as-is.
// - Then run scripts/measure-hooks.mjs to record each photo's hook apex in lib/products.ts.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SRC = "public/products";
const OUT = join(SRC, "cut");
const BG_TOL = 14; // max per-channel distance from the background that still counts as background
const EDGE_LO = 5; // edge alpha ramp (per-channel distance)
const EDGE_HI = 18;

mkdirSync(OUT, { recursive: true });

function decode(file) {
  const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]).toString().trim();
  const [w, h] = probe.split(",").map(Number);
  const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1 << 28 });
  return { w, h, raw };
}

function encode(file, w, h, raw) {
  // via a temp file: piping a whole frame on stdin gets truncated to 64KB packets
  const tmp = join(tmpdir(), `cutout-${process.pid}.rgba`);
  writeFileSync(tmp, raw);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${w}x${h}`, "-i", tmp, file]);
  rmSync(tmp);
}

/** Per-row background colour: median of 40px strips at the left and right edges (follows any vertical gradient). */
function rowBackground(w, h, raw) {
  const bg = new Float32Array(h * 3);
  for (let y = 0; y < h; y++) {
    for (let c = 0; c < 3; c++) {
      const s = [];
      for (let x = 0; x < 40; x += 2) s.push(raw[(y * w + x) * 4 + c], raw[(y * w + (w - 1 - x)) * 4 + c]);
      s.sort((a, b) => a - b);
      bg[y * 3 + c] = s[s.length >> 1];
    }
  }
  return bg;
}

function cutout(w, h, raw) {
  const bg = rowBackground(w, h, raw);
  const n = w * h;
  const dist = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const y = (i / w) | 0;
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(raw[i * 4 + c] - bg[y * 3 + c]));
    dist[i] = d;
  }
  // flood fill the background from the border
  const isBg = new Uint8Array(n);
  const queue = new Int32Array(n);
  let head = 0, tail = 0;
  const seed = (i) => { if (!isBg[i] && dist[i] <= BG_TOL) { isBg[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (head < tail) {
    const i = queue[head++], x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }
  // alpha: background 0, garment 255, soft ramp on the 2px band either side of the boundary
  const band = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const x = i % w;
    const edge = (x < w - 1 && isBg[i] !== isBg[i + 1]) || (i < n - w && isBg[i] !== isBg[i + w]);
    if (!edge) continue;
    const y = (i / w) | 0;
    for (let dy = -2; dy <= 3; dy++) for (let dx = -2; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) band[yy * w + xx] = 1;
    }
  }
  const out = Buffer.from(raw);
  for (let i = 0; i < n; i++) {
    let a = isBg[i] ? 0 : 255;
    if (band[i]) a = Math.round(255 * Math.min(1, Math.max(0, (dist[i] - EDGE_LO) / (EDGE_HI - EDGE_LO))));
    out[i * 4 + 3] = a;
  }
  return out;
}

const files = readdirSync(SRC).filter((f) => f.endsWith(".png")).sort();
const MASKS = join(tmpdir(), `cutout-masks-${process.pid}`);
mkdirSync(MASKS, { recursive: true });
const toLift = files.filter((f) => !f.endsWith("-back.png")).map((f) => join(SRC, f));
console.log(`lifting ${toLift.length} subjects with Vision…`);
execFileSync("swift", ["scripts/lift.swift", MASKS, ...toLift], { stdio: ["ignore", "ignore", "inherit"] });

function withVisionMask(f, w, h, rgba) {
  const m = execFileSync("ffmpeg", ["-loglevel", "error", "-i", join(MASKS, f), "-f", "rawvideo", "-pix_fmt", "gray", "-s", `${w}x${h}`, "-"], { maxBuffer: 1 << 28 });
  // Vision only fills where it is confident: its faint values include 1px streaks above some hooks.
  for (let i = 0; i < w * h; i++) if (m[i] >= 200) rgba[i * 4 + 3] = Math.max(rgba[i * 4 + 3], m[i]);
  return rgba;
}

for (const f of files.filter((f) => !f.endsWith("-back.png"))) {
  const { w, h, raw } = decode(join(SRC, f));
  encode(join(OUT, f), w, h, withVisionMask(f, w, h, cutout(w, h, raw)));
  console.log("cut", f);
}
rmSync(MASKS, { recursive: true, force: true });
console.log("next: node scripts/measure-hooks.mjs");
