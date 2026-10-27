// @ts-check
/**
 * UNKNOWN size picker: behaviour. Framework-free (the theme can load this same file). No libraries.
 * - Sizes come from the product's Shopify variants (/products/<handle>.js): the option named "Size"
 *   (any position), one entry per value, disabled when no variant with that size is available.
 *   In the Shopify theme the same list is printed by Liquid from product.variants, so no fetch is needed.
 * - Keyboard (WAI-ARIA radio group): arrow keys move the selection to the previous / next enabled
 *   size (wrapping), Home / End to the first / last; Tab leaves the group.
 */

/** @typedef {{ label: string, variantId?: number, available: boolean }} Size */

/** @type {Map<string, Promise<Size[] | null>>} */
const cache = new Map();

/**
 * Live sizes for a product, or null if the store can't be reached (the data file's snapshot stays).
 * @param {string} store e.g. https://www.unk-nown.com
 * @param {string} handle
 * @returns {Promise<Size[] | null>}
 */
export function fetchSizes(store, handle) {
  const key = `${store}/${handle}`;
  let p = cache.get(key);
  if (!p) {
    p = fetch(`${store}/products/${handle}.js`, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d || !Array.isArray(d.options) || !Array.isArray(d.variants)) return null;
        const at = d.options.findIndex((/** @type {{ name: string }} */ o) => /size/i.test(o.name));
        if (at < 0) return null;
        const values = /** @type {string[]} */ (d.options[at].values);
        const opt = `option${at + 1}`;
        return values.map((label) => {
          const vs = d.variants.filter((/** @type {Record<string, unknown>} */ v) => v[opt] === label);
          const live = vs.find((/** @type {{ available: boolean }} */ v) => v.available);
          return { label, variantId: (live ?? vs[0])?.id, available: !!live };
        });
      })
      .catch(() => null);
    cache.set(key, p);
  }
  return p;
}

/**
 * Index the selection moves to for a key, skipping disabled sizes, or null if the key isn't ours.
 * @param {Size[]} sizes
 * @param {number} from current index (-1 = nothing selected)
 * @param {string} key KeyboardEvent.key
 * @returns {number | null}
 */
export function nextSize(sizes, from, key) {
  const on = sizes.map((s, i) => (s.available ? i : -1)).filter((i) => i >= 0);
  if (!on.length) return null;
  if (key === "Home") return on[0];
  if (key === "End") return on[on.length - 1];
  const dir = key === "ArrowRight" || key === "ArrowDown" ? 1 : key === "ArrowLeft" || key === "ArrowUp" ? -1 : 0;
  if (!dir) return null;
  const at = on.indexOf(from);
  if (at < 0) return dir > 0 ? on[0] : on[on.length - 1];
  return on[(at + dir + on.length) % on.length];
}
