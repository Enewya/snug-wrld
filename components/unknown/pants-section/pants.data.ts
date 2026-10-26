/**
 * PANTS SECTION DATA: the only file to edit to change what the section shows.
 *
 * Order here = scroll order. Names, prices and links are copied from the live store and will come
 * from Shopify product blocks in the theme version (see HANDOFF.md). Every image is a layer of one
 * fixed 3:4 canvas (1086 × 1448): the body once, then each pair's pants only, then the hands on
 * top. All made from the model photos by scripts/build-unknown-pants-layers.py (see
 * assets/products-src/unknown/pants/PROCESSING.md).
 */

/** A layer's box on the 1086 x 1448 canvas, [x, y, width, height] in px. Each layer file is cropped
 *  to its own content (aligned/layers.json, written by the build script): a full-canvas layer would
 *  be mostly transparent, and the browser composites every pixel of it on every frame of a swap. */
export type LayerBox = [number, number, number, number];
export const PANTS_CANVAS = { width: 1086, height: 1448 };

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
  /** This pair's pants only (its grey copy shares the box). */
  image: string;
  box: LayerBox;
  /** Greyscale copy of the pants (baked by the image script) for the ghost. */
  grey: string;
  /** Left out of the section until its model image exists. */
  hidden?: boolean;
};

const STORE = "https://www.unk-nown.com";
const IMAGES = "/products/unknown/pants-layers"; // (a new folder each time the layer format changes: no stale caches)

/** Small label above the product name. */
export const PANTS_LABEL = "PANTS";

/** The neutral grey chinos (pants only): the rest state before the first pair arrives. */
export const PANTS_BASE = { src: `${IMAGES}/model-base.webp`, box: [317, 87, 446, 1113] as LayerBox };

/** The model without pants (never moves, never fades) and his hands (always in front). */
export const PANTS_BODY = { src: `${IMAGES}/body.webp`, box: [225, 0, 626, 1317] as LayerBox };
export const PANTS_HANDS = { src: `${IMAGES}/hands.webp`, box: [225, 59, 626, 418] as LayerBox };

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

const item = (handle: string, name: string, price: string, box: LayerBox, hidden = false): PantsItem => ({
  handle,
  name,
  display: titleCase(name),
  price,
  url: `${STORE}/products/${handle}`,
  image: `${IMAGES}/${handle}.webp`,
  box,
  grey: `${IMAGES}/${handle}-grey.webp`,
  hidden,
});

const all: PantsItem[] = [
  item("unknown-denim-jean", "UNKNOWN HARDCORE BAGGY DENIM JEAN", "₦145,000", [298, 87, 492, 1119]),
  item("unknown-side-eye-baggy-pant", "UNKNOWN SIDE EYE BAGGY PANT", "₦100,000", [254, 87, 567, 1172]),
  item("unknown-logo-sweatpant-brown", "UNKNOWN LOGO SWEATPANT BROWN", "₦100,000", [308, 87, 473, 1123]),
  // OFF until unknown-logo-sweatpant-red.webp exists (box from its run of the build script):
  // delete `, true` to show it
  item("unknown-logo-sweatpant-red", "UNKNOWN LOGO SWEATPANT RED", "₦100,000", [0, 0, 1086, 1448], true),
  item("unknown-lgt-strikes-joggers", "UNKNOWN LGT STRIKES", "₦100,000", [316, 83, 456, 1106]),
];

/** What the section shows, in order. */
export const pants = all.filter((p) => !p.hidden);

PANTS_INTRO.title = `${pants.length} pairs`;
