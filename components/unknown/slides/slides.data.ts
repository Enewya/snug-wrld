/**
 * SLIDES DATA: one product. Name, price and link from the store's product JSON
 * (https://www.unk-nown.com/products/unknown-f1-slide.js, checked 27 Oct 2026: "UNKNOWN F1",
 * ₦100,000, one variant "Black"). Photos: the client's own photo of the pair on a wooden floor,
 * cut out and straightened by scripts/build-unknown-slides.py (served 1x / 2x WebP); the strap view
 * is a crop of the same photo at its own resolution. In Shopify: a section with one product picker
 * and two image pickers (pair, strap).
 */
const STORE = "https://www.unk-nown.com";

export const SLIDES = {
  label: "Slides",
  name: "UNKNOWN F1",
  price: "₦100,000",
  url: `${STORE}/products/unknown-f1-slide`,
  linkText: "View product",
  views: [
    {
      key: "pair",
      toggle: "Pair",
      src: "/products/unknown/slides/unknown-f1-slide-pair.webp",
      src2x: "/products/unknown/slides/unknown-f1-slide-pair@2x.webp",
      width: 640,
      height: 800,
      alt: "UNKNOWN F1 slides, a black pair seen from above, the white script “unknown” on each strap",
    },
    {
      key: "strap",
      toggle: "Strap",
      src: "/products/unknown/slides/unknown-f1-slide-strap.webp",
      src2x: null,
      width: 560,
      height: 700,
      alt: "Close-up of the UNKNOWN F1 strap: the white handwritten “unknown” on textured black",
    },
  ],
} as const;
