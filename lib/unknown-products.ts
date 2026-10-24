import type { Product } from "./products";

/** Working names only. Shopify IDs, prices and availability belong to the production integration. */
const tops = [
  ["beige-panel-jacket", "Beige Panel Jacket"],
  ["black-jacket", "Black Graphic Jacket"],
  ["blue-striped-tee", "Blue Striped Tee"],
  ["green-film-tee", "Green Film Tee"],
  ["green-photo-tee", "Green Photo Tee"],
  ["green-plaid-shirt", "Green Panel Plaid Shirt"],
  ["grey-zip-hoodie", "Grey Zip Hoodie"],
  ["ivory-hoodie", "Ivory Hoodie"],
  ["orange-bird-vest", "Orange Bird Knit Vest"],
  ["white-film-tee", "White Film Tee"],
  ["yellow-misunderstood-tee", "Yellow Misunderstood Tee"],
];

export const unknownProducts: Product[] = tops.map(([slug, name]) => ({
  slug, name,
  side: `/products/unknown/${slug}-side.webp`,
  front: `/products/unknown/${slug}-front.webp`,
  back: `/products/unknown/${slug}-back.webp`,
}));
