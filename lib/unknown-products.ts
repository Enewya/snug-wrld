import type { Product } from "./products";

/**
 * Working names only. Shopify IDs, prices and availability belong to the production integration.
 * Rack order = this order (the draft hero's 7 garments). `on: false` keeps a garment in the data
 * but off the rack. `mirrorSide: true` = the side photo faces right, so it is shown mirrored (about
 * its hook) and every garment on the rack faces left; front and back photos are never flipped.
 * Checked one by one (front placket / print / hood position): the black jacket and the green plaid
 * shirt face right in their side photos; the other five face left.
 */
const tops: { slug: string; name: string; on: boolean; mirrorSide?: boolean }[] = [
  { slug: "beige-panel-jacket", name: "Beige Panel Jacket", on: true },
  { slug: "orange-bird-vest", name: "Orange Bird Knit Vest", on: true },
  { slug: "black-jacket", name: "Black Graphic Jacket", on: true, mirrorSide: true },
  { slug: "green-plaid-shirt", name: "Green Panel Plaid Shirt", on: true, mirrorSide: true },
  { slug: "ivory-hoodie", name: "Ivory Hoodie", on: true },
  { slug: "grey-zip-hoodie", name: "Grey Zip Hoodie", on: true },
  { slug: "blue-striped-tee", name: "Blue Striped Tee", on: true },
  { slug: "green-film-tee", name: "Green Film Tee", on: false },
  { slug: "green-photo-tee", name: "Green Photo Tee", on: false },
  { slug: "white-film-tee", name: "White Film Tee", on: false },
  { slug: "yellow-misunderstood-tee", name: "Yellow Misunderstood Tee", on: false },
];

export const unknownProducts: Product[] = tops.filter((t) => t.on).map(({ slug, name, mirrorSide }) => ({
  slug, name,
  side: `/products/unknown/${slug}-side.webp`,
  front: `/products/unknown/${slug}-front.webp`,
  back: `/products/unknown/${slug}-back.webp`,
  ...(mirrorSide ? { mirrorSide } : {}),
}));
