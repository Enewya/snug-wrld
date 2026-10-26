// Writes the served WebPs for the /unknown store photography (lookbook, caps, new arrivals, two piece).
//
//   node scripts/optimize-unknown-store-photos.mjs
//
// Sources (not served, downloaded from unk-nown.com's Shopify CDN): reference/lookbook,
// reference/caps, reference/new-arrival, reference/two-piece. Output: public/products/unknown/<folder>/<name>.webp,
// longest side capped (lookbook 1600, products 1200), quality 78 stepping down to stay under
// 300 KB. next/image then serves each at the size it is displayed.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";

const JOBS = [
  { src: "reference/lookbook", out: "public/products/unknown/lookbook", max: 1600 },
  { src: "reference/caps", out: "public/products/unknown/caps", max: 1200 },
  { src: "reference/new-arrival", out: "public/products/unknown/new-arrival", max: 1200 },
  { src: "reference/two-piece", out: "public/products/unknown/two-piece", max: 1500 },
];
const MAX_KB = 300;

for (const { src, out, max } of JOBS) {
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(src).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
    const dest = join(out, `${parse(f).name}.webp`);
    for (const quality of [78, 72, 66]) {
      await sharp(join(src, f)).rotate().resize({ width: max, height: max, fit: "inside", withoutEnlargement: true })
        .webp({ quality, alphaQuality: 90, effort: 6 }).toFile(dest);
      if (statSync(dest).size <= MAX_KB * 1024) break;
    }
    const { width, height } = await sharp(dest).metadata();
    console.log(`${dest.padEnd(70)} ${width}x${height} ${(statSync(dest).size / 1024).toFixed(0)} KB`);
  }
}
