/**
 * Stands in for lib/products.ts in the Shopify bundle (see scripts/build-shopify.mjs). The rack and
 * detail view read the same exports, but here they start empty and are filled from the section's
 * settings: loadRack() downloads every garment photo, finds the hook and hem in it
 * (lib/measureHook.mjs, the same code the Next site runs at build time) and adds the product.
 */
import type { ColourFit, Colourway, Photo, Product } from "@/lib/products";
import { measure, MEASURE_WIDTH } from "@/lib/measureHook.mjs";

export type { ColourFit, Colourway, Photo, Product } from "@/lib/products";

export const LOOP_GAP_RATIO = 33 / 1086;
export const photos: Record<string, Photo> = {};
export const photoScale: Record<string, number> = {};
export const colourFit: Record<string, ColourFit> = {};
export const products: Product[] = [];

/** "Name — Colour", as in the rack's hover caption. */
export const captionOf = (p: Product) => {
  const colour = p.colourways?.[0].label ?? p.colour;
  return colour ? `${p.name} — ${colour}` : p.name;
};

/** One colour of a garment block (sections/rack-hero.liquid). Photos are URLs sized to MEASURE_WIDTH. */
export type RackColourInput = {
  label: string | null;
  hex: string | null;
  side: string | null;
  front: string | null;
  back: string | null;
};
/** The product's options and variants, for the detail view's price, sizes and ADD TO CART. */
export type ShopData = {
  available: boolean;
  options: { name: string; values: string[] }[];
  variants: { id: number; options: string[]; available: boolean; price: string; compare: string | null }[];
};
/** One garment block: the product and its colours, the first being the one on the rack. */
export type RackInput = {
  handle: string | null;
  title: string | null;
  url: string | null;
  shop: ShopData | null;
  colours: RackColourInput[];
};

/** Shop data of each rack product, by slug. */
export const shop: Record<string, ShopData> = {};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // the canvas has to read the pixels back, so the CDN must allow it (Shopify's does)
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

/** Measures a photo at MEASURE_WIDTH (the hook finder's pixel constants are tuned for it). */
async function measurePhoto(src: string): Promise<Photo> {
  const img = await loadImage(src);
  const W = MEASURE_WIDTH;
  const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, W, H);
  const m = measure(ctx.getImageData(0, 0, W, H).data, W, H);
  if (m.apexY >= H || m.innerBottom <= m.innerTop || m.neckY <= m.apexY || m.bottom <= m.neckY) {
    throw new Error(`no hanger hook found in ${src} (is the background transparent?)`);
  }
  return {
    width: W,
    height: H,
    hookApexX: m.apexX,
    hookApexY: m.apexY,
    loopTopY: m.apexY,
    loopCenterX: m.cx,
    loopInnerTopY: m.innerTop,
    loopInnerBottomY: m.innerBottom,
    neckY: m.neckY,
    garmentTopY: m.apexY,
    garmentBottomY: m.bottom,
    shoulderY: m.shoulder.y,
    shoulderX0: m.shoulder.x0,
    shoulderX1: m.shoulder.x1,
    garmentX0: m.left,
    garmentX1: m.right,
  };
}

const garmentH = (m: Photo) => m.garmentBottomY - m.garmentTopY;
const hookY = (m: Photo) => (m.loopInnerTopY + m.loopInnerBottomY) / 2;

/** A colour's photos, measured; null if its side or front photo is missing or has no findable hook. */
async function loadColour(c: RackColourInput, name: string): Promise<Colourway | null> {
  if (!c.side || !c.front) return null;
  try {
    const [side, front, back] = await Promise.all([
      measurePhoto(c.side),
      measurePhoto(c.front),
      c.back ? measurePhoto(c.back).catch((e) => (console.warn(`[rack-hero] ${name} back:`, e), null)) : null,
    ]);
    photos[c.side] = side;
    photos[c.front] = front;
    // a garment is the same real size whichever photo shows: side = 1, front / back scaled to match
    photoScale[c.side] = 1;
    photoScale[c.front] = garmentH(side) / garmentH(front);
    if (back && c.back) {
      photos[c.back] = back;
      photoScale[c.back] = garmentH(side) / garmentH(back);
    }
    return { label: c.label ?? "", hex: c.hex || "#9a978f", side: c.side, front: c.front, back: back ? c.back! : undefined };
  } catch (e) {
    console.warn(`[rack-hero] ${name}:`, e);
    return null;
  }
}

/**
 * Colourway photos of one product are shot slightly differently. In the detail view every
 * colourway photo is fitted onto the first colourway's (same view): hook height, shoulder width and
 * hem line match, so a colour switch changes only the colour, never the outline (as lib/products.ts).
 */
function fitColourways(ways: Colourway[]) {
  for (const view of ["front", "back"] as const) {
    const ref = ways[0][view];
    if (!ref) continue;
    const r = photos[ref];
    for (const w of ways.slice(1)) {
      const src = w[view];
      if (!src) continue;
      const m = photos[src];
      colourFit[src] = {
        ref,
        sx: (r.shoulderX1 - r.shoulderX0) / (m.shoulderX1 - m.shoulderX0),
        sy: (r.garmentBottomY - hookY(r)) / (m.garmentBottomY - hookY(m)),
      };
    }
  }
}

/**
 * Replaces the rack's products with the section's garments, in order. A garment is left off the
 * rack when it has no product or its first colour can't be shown; a colour that can't be shown is
 * left off its garment's swing tags.
 */
export async function loadRack(items: RackInput[]) {
  const loaded = await Promise.all(
    items.map(async (it) => {
      if (!it.url) return null;
      const name = it.title ?? it.handle ?? "garment";
      const ways = await Promise.all(it.colours.map((c) => loadColour(c, name)));
      if (!ways[0]) return null;
      return { it, ways: ways.filter((w): w is Colourway => w !== null) };
    }),
  );
  products.length = 0;
  for (const k of Object.keys(shop)) delete shop[k];
  loaded.forEach((r, i) => {
    if (!r) return;
    const { it, ways } = r;
    const [first] = ways;
    const product: Product = {
      slug: `${it.handle ?? "garment"}-${i}`,
      name: it.title ?? "",
      side: first.side,
      front: first.front,
      back: first.back,
      url: it.url!,
    };
    // swing tags only for a garment that comes in more than one colour
    if (ways.length > 1) {
      fitColourways(ways);
      product.colourways = ways;
    } else if (first.label) {
      product.colour = first.label;
    }
    if (it.shop) shop[product.slug] = it.shop;
    products.push(product);
  });
}
