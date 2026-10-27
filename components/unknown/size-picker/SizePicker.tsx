"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, Size } from "@/lib/products";
import { STORE } from "@/lib/unknown-products";
import { fetchSizes, nextSize } from "./size-picker-behaviour";
import "./size-picker.css";

/**
 * Size pills (same shape as the FRONT / BACK pill) between the pill and the availability link, as a
 * radio group. "See availability" opens the store's product page, with the chosen size's variant
 * (?variant=<id>) once a size is picked. Sizes: product.sizes (data file snapshot), refreshed from
 * the store when the view opens; placeholder sizes (no store match) are shown but not linked.
 * Mount with key={product.slug} so the choice resets per product.
 */
export default function SizePicker({ product }: { product: Product }) {
  const [sizes, setSizes] = useState<Size[]>(product.sizes ?? []);
  const [sel, setSel] = useState(-1);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!product.handle) return;
    let on = true;
    fetchSizes(STORE, product.handle).then((live) => { if (on && live?.length) setSizes(live); });
    return () => { on = false; };
  }, [product.handle]);

  const pick = (i: number, focus = false) => {
    setSel(i);
    if (focus) refs.current[i]?.focus();
  };
  // roving tabindex: the selected size, else the first available one, takes the Tab stop
  const tabAt = sel >= 0 ? sel : sizes.findIndex((s) => s.available);
  const chosen = sel >= 0 ? sizes[sel] : undefined;
  const href = product.url && (chosen?.variantId ? `${product.url}?variant=${chosen.variantId}` : product.url);

  return (
    <div className="usp">
      <div className="usp__sizes" role="radiogroup" aria-label={`Size${product.sizesPlaceholder ? " (sample sizes)" : ""}`}
        onKeyDown={(e) => {
          const i = nextSize(sizes, sel >= 0 ? sel : tabAt, e.key);
          if (i === null) return;
          // the detail view also uses the arrow keys (previous / next piece): inside the sizes they are ours
          e.preventDefault();
          e.stopPropagation();
          pick(i, true);
        }}>
        {sizes.map((s, i) => (
          <button key={s.label} ref={(el) => { refs.current[i] = el; }} type="button" role="radio"
            className="usp__size" aria-checked={sel === i} disabled={!s.available}
            aria-label={s.available ? s.label : `${s.label}, unavailable`}
            tabIndex={i === tabAt ? 0 : -1} onClick={() => pick(i)}>
            {s.label}
          </button>
        ))}
      </div>
      {href ? (
        <a className="info-cta usp__cta" href={href} target="_blank" rel="noopener"
          aria-label={`See availability of ${product.name}${chosen ? `, size ${chosen.label}` : ""} (opens in a new tab)`}>
          SEE AVAILABILITY
        </a>
      ) : <span className="usp__cta-space" aria-hidden="true" />}
    </div>
  );
}
