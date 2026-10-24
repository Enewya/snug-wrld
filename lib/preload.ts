"use client";

import { getImageProps } from "next/image";
import { products, type Product } from "./products";
import { photos } from "./photo-catalog";

/** `sizes` of the detail view's photos. Preloads must use the same value so the cache hit is real. */
export const FOCUS_SIZES = "(max-width: 640px) 80vw, 50vh";

/** The props next/image renders for a detail-view photo. */
export function focusImgProps(src: string) {
  const m = photos[src];
  return getImageProps({ src, width: m.width, height: m.height, sizes: FOCUS_SIZES, alt: "" }).props;
}

const loading = new Map<string, Promise<string>>();
/** Photos already decoded, with the URL the browser picked. Read synchronously by click handlers. */
const ready = new Map<string, string>();

/**
 * Loads and decodes a detail-view photo exactly as the view's <img> does (same srcset + sizes, so
 * the same file). Resolves with the URL the browser picked. Every call after the first is free.
 */
export function preloadFocus(src: string): Promise<string> {
  let p = loading.get(src);
  if (!p) {
    const props = focusImgProps(src);
    const img = new window.Image();
    if (props.sizes) img.sizes = props.sizes;
    if (props.srcSet) img.srcset = props.srcSet;
    img.src = props.src;
    p = img
      .decode()
      .catch(() => {})
      .then(() => {
        const url = img.currentSrc || props.src;
        ready.set(src, url);
        return url;
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
export function preloadProduct(index: number, neighbours = false, catalog: Product[] = products) {
  const n = catalog.length;
  const list = neighbours ? [index, (index + 1) % n, (index - 1 + n) % n] : [index];
  for (const i of list) productPhotos(catalog[i]).forEach(preloadFocus);
}

/** Once the rack is up and the page is idle: every product's and colourway's front photo. */
export function preloadFrontsWhenIdle() {
  const run = () => products.forEach((p) => (p.colourways ?? [p]).forEach((v) => preloadFocus(v.front)));
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1200);
}
