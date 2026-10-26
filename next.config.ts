import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  images: {
    // WebP only. AVIF files are ~30% smaller, but Chrome decodes them several times slower, and
    // that decode lands on the first frames a photo is on screen (measured on the lookbook: about
    // 1 s of decode while scrolling into it, 13 frames over 20 ms). Shopify's CDN serves WebP too.
    formats: ["image/webp"],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
