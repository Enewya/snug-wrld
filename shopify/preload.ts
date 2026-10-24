/**
 * Stands in for lib/preload.ts in the Shopify bundle. Same exports, but photos load from the exact
 * URL the rack measured them from, with CORS like shopify/image.tsx, so every request for a photo
 * is the same cached download.
 */
import { products, type Product } from "./products";

/** `sizes` of the detail view's photos (kept for the components that pass it along). */
export const FOCUS_SIZES = "(max-width: 640px) 80vw, 50vh";

/** The image props the detail view renders for a photo. */
export function focusImgProps(src: string) {
  return { src, sizes: FOCUS_SIZES, srcSet: undefined as string | undefined };
}

const loading = new Map<string, Promise<string>>();
/** Photos already decoded. Read synchronously by click handlers. */
const ready = new Map<string, string>();

/** Loads and decodes a detail-view photo. Resolves with its URL. Every call after the first is free. */
export function preloadFocus(src: string): Promise<string> {
  let p = loading.get(src);
  if (!p) {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    p = img
      .decode()
      .catch(() => {})
      .then(() => {
        ready.set(src, src);
        return src;
      });
    loading.set(src, p);
  }
  return p;
}

/** The decoded URL of a photo if it's ready, else undefined (never waits). */
export const readyUrl = (src: string) => ready.get(src);

/** Every photo a product's detail view can show: each colourway's front and back. */
export function productPhotos(p: Product) {
  return (p.colourways ?? [p]).flatMap((v) => [v.front, v.back]).filter((s): s is string => !!s);
}

/** Preload a product's detail photos (and optionally its neighbours') in the background. */
export function preloadProduct(index: number, neighbours = false) {
  const n = products.length;
  if (!n) return;
  const list = neighbours ? [index, (index + 1) % n, (index - 1 + n) % n] : [index];
  for (const i of list) productPhotos(products[i]).forEach(preloadFocus);
}

/** Once the rack is up and the page is idle: every product's and colourway's front photo. */
export function preloadFrontsWhenIdle() {
  const run = () => products.forEach((p) => (p.colourways ?? [p]).forEach((v) => preloadFocus(v.front)));
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1200);
}
