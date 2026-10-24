import type { Product } from "./products";

/**
 * Working names only. Shopify IDs, prices and availability belong to the production integration.
 * Rack order = this order (the draft hero's 7 garments). `on: false` keeps a garment in the data
 * but off the rack.
 */
const tops: { slug: string; name: string; on: boolean }[] = [
  { slug: "beige-panel-jacket", name: "Beige Panel Jacket", on: true },
  { slug: "orange-bird-vest", name: "Orange Bird Knit Vest", on: true },
  { slug: "black-jacket", name: "Black Graphic Jacket", on: true },
  { slug: "green-plaid-shirt", name: "Green Panel Plaid Shirt", on: true },
  { slug: "ivory-hoodie", name: "Ivory Hoodie", on: true },
  { slug: "grey-zip-hoodie", name: "Grey Zip Hoodie", on: true },
  { slug: "blue-striped-tee", name: "Blue Striped Tee", on: true },
  { slug: "green-film-tee", name: "Green Film Tee", on: false },
  { slug: "green-photo-tee", name: "Green Photo Tee", on: false },
  { slug: "white-film-tee", name: "White Film Tee", on: false },
  { slug: "yellow-misunderstood-tee", name: "Yellow Misunderstood Tee", on: false },
];

export const unknownProducts: Product[] = tops.filter((t) => t.on).map(({ slug, name }) => ({
  slug, name,
  side: `/products/unknown/${slug}-side.webp`,
  front: `/products/unknown/${slug}-front.webp`,
  back: `/products/unknown/${slug}-back.webp`,
}));
