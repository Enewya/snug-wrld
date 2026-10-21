// Writes the served product photos: one WebP per photo the site shows, transparency kept.
//
//   node scripts/optimize-images.mjs      (after scripts/cutout.mjs; then scripts/measure-hooks.mjs)
//
// Sources (not served): assets/products-src/cut/<base>-{side,front}.png (cut-outs) and
// assets/products-src/<base>-back.png. Output: public/products/<base>-<view>.webp at full size
// (1086px wide, more than 2x the largest display width), quality 82, so all hook/garment
// measurements carry over. next/image then serves AVIF or WebP at the size each view needs.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC = "assets/products-src";
const OUT = "public/products";
const MAX_KB = 200;
mkdirSync(OUT, { recursive: true });

const jobs = [
  ...readdirSync(join(SRC, "cut")).filter((f) => /-(side|front)\.png$/.test(f)).map((f) => join(SRC, "cut", f)),
  ...readdirSync(SRC).filter((f) => f.endsWith("-back.png")).map((f) => join(SRC, f)),
].sort();

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
