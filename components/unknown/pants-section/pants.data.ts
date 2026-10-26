/**
 * PANTS SECTION DATA: the only file to edit to change what the section shows.
 *
 * Order here = scroll order. Names, prices and links are copied from the live store and will come
 * from Shopify product blocks in the theme version (see HANDOFF.md). Every image is a layer of one
 * fixed 3:4 canvas (1086 × 1448): the body once, then each pair's pants only, then the hands on
 * top. All made from the model photos by scripts/build-unknown-pants-layers.py (see
 * assets/products-src/unknown/pants/PROCESSING.md).
 */

export type PantsItem = {
  /** Shopify product handle; also the image file name. */
  handle: string;
  /** Exact store name (uppercase on the live store). */
  name: string;
  /** The same name in title case for the large display type, as in the reference. */
  display: string;
  /** Display price, already formatted. */
  price: string;
  /** Product page (the section's "View product" link points here). */
  url: string;
  /** This pair's pants only, on the shared canvas (transparent elsewhere). */
  image: string;
  /** Greyscale copy of the pants (baked by the image script) for the ghost. */
  grey: string;
  /** Left out of the section until its model image exists. */
  hidden?: boolean;
};

const STORE = "https://www.unk-nown.com";
const IMAGES = "/products/unknown/pants";

/** Small label above the product name. */
export const PANTS_LABEL = "PANTS";

/** The neutral grey chinos (pants only): the rest state before the first pair arrives. */
export const PANTS_BASE_IMAGE = `${IMAGES}/model-base.webp`;

/** The model without pants (never moves, never fades) and his hands (always in front). */
export const PANTS_BODY_IMAGE = `${IMAGES}/body.webp`;
export const PANTS_HANDS_IMAGE = `${IMAGES}/hands.webp`;

/** The collection link at the bottom right of the pinned section (Liquid: a section setting). */
export const PANTS_VIEW_ALL = { label: "View all", url: `${STORE}/collections/pants` };

/** The one link to the pair on screen, under its price (Liquid: a section setting). */
export const PANTS_VIEW_PRODUCT = "View product";

/** Text shown with the base pants, before the first pair (factual, no marketing copy). */
export const PANTS_INTRO = {
  title: "", // set below from the number of pairs shown, e.g. "4 pairs"
  meta: "Scroll to try each one on",
};

/** Pre-rendered atmosphere layers (scripts/generate-unknown-clouds.py). */
export const PANTS_ATMOSPHERE = {
  back: "/products/unknown/atmosphere/clouds-back.webp",
  front: "/products/unknown/atmosphere/clouds-front.webp",
  mist: "/products/unknown/atmosphere/mist.webp",
};

/** Words that stay uppercase in the display name. */
const ACRONYMS = new Set(["LGT"]);
const titleCase = (name: string) =>
  name.split(" ").map((w) => (ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(" ");

const item = (handle: string, name: string, price: string, hidden = false): PantsItem => ({
  handle,
  name,
  display: titleCase(name),
  price,
  url: `${STORE}/products/${handle}`,
  image: `${IMAGES}/${handle}.webp`,
  grey: `${IMAGES}/${handle}-grey.webp`,
  hidden,
});

const all: PantsItem[] = [
  item("unknown-denim-jean", "UNKNOWN HARDCORE BAGGY DENIM JEAN", "₦145,000"),
  item("unknown-side-eye-baggy-pant", "UNKNOWN SIDE EYE BAGGY PANT", "₦100,000"),
  item("unknown-logo-sweatpant-brown", "UNKNOWN LOGO SWEATPANT BROWN", "₦100,000"),
  // OFF until unknown-logo-sweatpant-red.webp exists: delete `, true` to show it
  item("unknown-logo-sweatpant-red", "UNKNOWN LOGO SWEATPANT RED", "₦100,000", true),
  item("unknown-lgt-strikes-joggers", "UNKNOWN LGT STRIKES", "₦100,000"),
];

/** What the section shows, in order. */
export const pants = all.filter((p) => !p.hidden);

PANTS_INTRO.title = `${pants.length} pairs`;
