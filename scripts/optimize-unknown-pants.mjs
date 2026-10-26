// Writes the UNKNOWN pants-section layers: one WebP per layer (body, hands, each pants and its
// grey copy), transparency kept.
//
//   node scripts/optimize-unknown-pants.mjs      (after scripts/build-unknown-pants-layers.py)
//
// A copy of scripts/optimize-images.mjs scoped to the pants folders (same quality ladder and
// 200 KB budget). Sources: assets/products-src/unknown/pants/aligned/<name>.png. Output:
// public/products/unknown/pants-layers/<name>.webp at the layer's own (cropped) size.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "assets/products-src/unknown/pants/aligned";
const OUT = "public/products/unknown/pants-layers";
const MAX_KB = 200;
mkdirSync(OUT, { recursive: true });

const jobs = readdirSync(SRC).filter((f) => f.endsWith(".png")).map((f) => join(SRC, f)).sort();

let total = 0;
for (const src of jobs) {
  const out = join(OUT, src.split("/").pop().replace(/\.png$/, ".webp"));
  // step quality down only if a photo would exceed the budget
  for (const quality of [82, 76, 70]) {
    await sharp(src).webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(out);
    if (statSync(out).size <= MAX_KB * 1024) break;
  }
  const kb = statSync(out).size / 1024;
  total += kb;
  console.log(out.padEnd(48), `${kb.toFixed(0)} KB`, kb > MAX_KB ? " <- over budget" : "");
}
console.log(`${jobs.length} photos, ${(total / 1024).toFixed(1)} MB total, ${(total / jobs.length).toFixed(0)} KB average`);
