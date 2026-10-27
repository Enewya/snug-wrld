// Encode the Slides section images (scripts/build-unknown-slides.py) to WebP: the repo's ladder
// (quality 82 / 76 / 70, alphaQuality 90, effort 6), 200 KiB budget per file. Run: node scripts/encode-unknown-slides.mjs
import { readdirSync, statSync, unlinkSync } from "node:fs";
import sharp from "sharp";

const dir = "public/products/unknown/slides";
for (const f of readdirSync(dir).filter((n) => n.endsWith(".png"))) {
  const out = `${dir}/${f.replace(/\.png$/, ".webp")}`;
  for (const quality of [82, 76, 70]) {
    await sharp(`${dir}/${f}`).webp({ quality, alphaQuality: 90, effort: 6, smartSubsample: true }).toFile(out);
    if (statSync(out).size <= 200 * 1024) break;
  }
  const { width, height } = await sharp(out).metadata();
  console.log(out, width, "x", height, Math.round(statSync(out).size / 1024), "KB");
  unlinkSync(`${dir}/${f}`); // PNGs are intermediate; the build script regenerates them
}
