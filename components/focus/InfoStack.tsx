"use client";

import { useLayoutEffect, useRef } from "react";
import type { Product } from "@/lib/products";

type Props = {
  name: string;
  url: string;
  /** Which photo the pill shows as selected. Comes only from FRONT / BACK clicks (never the turn). */
  face: "front" | "back";
  /** Slide the knob (a click) or move it instantly (reset on a product switch). */
  animateFace: boolean;
  /** No back photo: the pill's space is kept (so nothing below moves) but it isn't shown. */
  hasBack: boolean;
  onFace: (back: boolean) => void;
  /** The product and its selected colourway (used by the Shopify bundle's shopify/ShopInfo.tsx). */
  product?: Product;
  colour?: number;
};

const NAME_PX = 24;
const NAME_MIN_PX = 18;
const DESKTOP = "(min-width: 641px)";

/**
 * Info under the garment, at a fixed position for every product: name, FRONT / BACK pill,
 * availability link. The name box has a fixed height; on desktop a long name shrinks (down to
 * 18px) to stay on one line, on mobile it may take the two lines reserved for it.
 */
export default function InfoStack({ name, url, face, animateFace, hasBack, onFace }: Props) {
  const back = face === "back";
  const nameRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      if (!window.matchMedia(DESKTOP).matches) return;
      const room = el.clientWidth;
      const need = el.scrollWidth;
      if (need > room) el.style.fontSize = `${Math.max(NAME_MIN_PX, Math.floor((NAME_PX * room) / need))}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [name]);

  return (
    <div className="info">
      <h2 className="info-name" ref={nameRef}>
        {name}
      </h2>
      <div
        className={`seg${animateFace ? " seg-animate" : ""}`}
        role="group"
        aria-label="Show front or back"
        style={hasBack ? undefined : { visibility: "hidden" }}
        aria-hidden={!hasBack}
      >
        <span className="seg-knob" style={{ transform: back ? "translateX(100%)" : "translateX(0)" }} />
        <button type="button" className={back ? "" : "lit"} aria-pressed={!back} onClick={() => onFace(false)} tabIndex={hasBack ? undefined : -1}>
          FRONT
        </button>
        <button type="button" className={back ? "lit" : ""} aria-pressed={back} onClick={() => onFace(true)} tabIndex={hasBack ? undefined : -1}>
          BACK
        </button>
      </div>
      <a className="info-cta" href={url} target="_blank" rel="noopener" aria-label={`See availability of ${name} (opens in a new tab)`}>
        SEE AVAILABILITY ↗
      </a>
    </div>
  );
}
