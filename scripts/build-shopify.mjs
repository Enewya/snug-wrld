// Builds the Shopify Rack hero: the rack components bundled into one script, plus its CSS.
//
//   npm run build:shopify                                  writes shopify/theme/assets/
//   npm run build:shopify -- --theme ../unk-nown-theme     also copies the sections + assets into a theme
//
// The bundle swaps four modules: @/lib/products → shopify/products.ts (garments come from the
// section's settings, measured in the browser), @/lib/preload → shopify/preload.ts, next/image →
// shopify/image.tsx, and the detail view's InfoStack → shopify/ShopInfo.tsx (price, sizes, cart).
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const OUT = "shopify/theme";
const swaps = {
  "@/lib/products": resolve("shopify/products.ts"),
  "@/lib/preload": resolve("shopify/preload.ts"),
  "next/image": resolve("shopify/image.tsx"),
};

mkdirSync(join(OUT, "assets"), { recursive: true });

await build({
  entryPoints: ["shopify/main.tsx"],
  outfile: join(OUT, "assets/rack-hero.js"),
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [
    {
      name: "swaps",
      setup(b) {
        b.onResolve({ filter: /^(@\/lib\/(products|preload)|next\/image)$/ }, (args) => ({ path: swaps[args.path] }));
        b.onResolve({ filter: /^\.\/InfoStack$/ }, () => ({ path: resolve("shopify/ShopInfo.tsx") }));
      },
    },
  ],
  logLevel: "warning",
});

// The rack's share of app/globals.css: the wall, rail, garment and detail-view rules, and the rack layout.
const css = readFileSync("app/globals.css", "utf8");
const slice = (from, to) => {
  const a = css.indexOf(from);
  const b = to ? css.indexOf(to, a) : css.length;
  if (a < 0 || b < 0) throw new Error(`app/globals.css: marker not found: ${a < 0 ? from : to}`);
  return css.slice(a, b).trim();
};
writeFileSync(
  join(OUT, "assets/rack-hero.css"),
  [
    readFileSync("shopify/rack-hero.css", "utf8").trim(),
    slice("/* Faint grid of small hanger-hook outlines", "/* ---------- Marquee"),
    slice("/* ---------- Rack layout"),
  ].join("\n\n") + "\n",
);

const theme = process.argv.indexOf("--theme");
if (theme > 0) {
  const dir = process.argv[theme + 1];
  for (const f of ["sections/rack-hero.liquid", "sections/snug-header.liquid", "assets/rack-hero.js", "assets/rack-hero.css"]) {
    cpSync(join(OUT, f), join(dir, f));
  }
  console.log(`copied the Rack hero into ${dir}`);
}
