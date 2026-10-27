import type { Product, Size } from "./products";

/** The store the prototype reads (prices, sizes, links). In the Shopify theme this is the shop itself. */
export const STORE = "https://www.unk-nown.com";

/** Shown when a garment has no store product matched yet. Not real: flagged by `sizesPlaceholder`. */
const PLACEHOLDER_SIZES: Size[] = [
  { label: "L", available: true },
  { label: "XL", available: true },
  { label: "XXL", available: true },
];

type Top = {
  slug: string;
  name: string;
  on: boolean;
  /** Rack order, ascending (rack and detail view). Lower = further left. */
  position: number;
  mirrorSide?: boolean;
  /** Shopify product handle, only where the store product is a certain match. */
  handle?: string;
  /** Snapshot of /products/<handle>.js (price, Size variants), checked 2026-10-27. Refreshed at runtime
   *  from the same endpoint when the detail view opens (lib/unknown-variants.ts). */
  price?: string;
  sizes?: Size[];
};

/**
 * Working names, except where noted. `on: false` keeps a garment in the data but off the rack.
 * `mirrorSide: true` = the side photo faces right, so it is shown mirrored (about its hook) and every
 * garment on the rack faces left; front and back photos are never flipped.
 * Checked one by one (front placket / print / hood position): the black jacket and the green plaid
 * shirt face right in their side photos; the others face left (the Tranquility jersey's side photo
 * shows its print on the left edge, i.e. it faces left).
 * Store matches: beige panel jacket = UNKNOWN CAELUM JACKET (the client's unk-nown.com screenshot),
 * blue striped tee = UNKNOWN SHHSHHSH JERSEY (same "shhshhsh" print), white Tranquility mesh tee =
 * UNKNOWN ORIGINAL TRANQUILITY JERSEY (real name, price and link). The rest have no certain match:
 * no price line, placeholder sizes, no link.
 */
const tops: Top[] = [
  { slug: "beige-panel-jacket", name: "Beige Panel Jacket", on: true, position: 1, handle: "unknown-caelum-jacket", price: "₦180,000.00",
    sizes: [{ label: "L", variantId: 48049943642344, available: true }, { label: "XL", variantId: 48049943675112, available: true }, { label: "XXL", variantId: 48049943707880, available: true }] },
  { slug: "orange-bird-vest", name: "Orange Bird Knit Vest", on: true, position: 2 },
  { slug: "black-jacket", name: "Black Graphic Jacket", on: true, position: 3, mirrorSide: true },
  { slug: "green-plaid-shirt", name: "Green Panel Plaid Shirt", on: true, position: 4, mirrorSide: true },
  { slug: "ivory-hoodie", name: "Ivory Hoodie", on: true, position: 5 },
  { slug: "grey-zip-hoodie", name: "Grey Zip Hoodie", on: true, position: 6 },
  { slug: "blue-striped-tee", name: "Blue Striped Tee", on: true, position: 7, handle: "unknown-shhshhsh-jersey", price: "₦100,000.00",
    sizes: [{ label: "S", variantId: 47971339010280, available: true }, { label: "L", variantId: 47971339043048, available: true }, { label: "XL", variantId: 47971339075816, available: true }, { label: "2XL", variantId: 47971339108584, available: true }] },
  { slug: "white-tranquility-mesh-tee", name: "UNKNOWN ORIGINAL TRANQUILITY JERSEY", on: true, position: 8, handle: "unknown-original-tranquility-jersey", price: "₦100,000.00",
    sizes: [{ label: "L", variantId: 47971336159464, available: true }, { label: "XL", variantId: 47971336192232, available: true }, { label: "2XL", variantId: 47971336225000, available: true }] },
  { slug: "green-film-tee", name: "Green Film Tee", on: false, position: 90 },
  { slug: "green-photo-tee", name: "Green Photo Tee", on: false, position: 91 },
  { slug: "white-film-tee", name: "White Film Tee", on: false, position: 92 },
  { slug: "yellow-misunderstood-tee", name: "Yellow Misunderstood Tee", on: false, position: 93 },
];

export const unknownProducts: Product[] = tops
  .filter((t) => t.on)
  .sort((a, b) => a.position - b.position)
  .map(({ slug, name, mirrorSide, handle, price, sizes }) => ({
    slug, name,
    side: `/products/unknown/${slug}-side.webp`,
    front: `/products/unknown/${slug}-front.webp`,
    back: `/products/unknown/${slug}-back.webp`,
    ...(mirrorSide ? { mirrorSide } : {}),
    ...(handle ? { handle, url: `${STORE}/products/${handle}` } : {}),
    ...(price ? { price } : {}),
    sizes: sizes ?? PLACEHOLDER_SIZES,
    ...(sizes ? {} : { sizesPlaceholder: true }),
  }));
