"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import UnkLink from "../link/UnkLink";
import { LOOKBOOK, looks } from "./lookbook.data";
import { initLookbook } from "./lookbook-behaviour";
import "./lookbook-styles.css";

/** Lookbook: one editorial row of real looks, swipeable, prev/next buttons. No visible captions;
 *  each photo has alt text, and looks with a known product show its link under the photo. */
export default function Lookbook() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initLookbook(ref.current) : undefined), []);
  return (
    <section ref={ref} className="unk-section unk-lookbook" aria-labelledby="unk-lookbook-title">
      <div className="unk-wrap">
        <header className="unk-head">
          <div>
            <span className="unk-head__label unk-lookbook__label">{LOOKBOOK.label}</span>
            <h2 id="unk-lookbook-title" className="unk-head__title unk-lookbook__title">{LOOKBOOK.title}</h2>
          </div>
          <div className="unk-lookbook__actions">
            <button type="button" className="unk-icon-btn unk-state" data-look-prev aria-label="Previous look" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="unk-icon-btn unk-state" data-look-next aria-label="Next look">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </header>
      </div>
      <ul className="unk-lookbook__row" data-look-row role="list" tabIndex={0} aria-label="Looks (scroll sideways)">
        {looks.map((l, i) => (
          <li key={l.src} className="unk-look" style={{ "--ar": `${l.width} / ${l.height}` } as React.CSSProperties}>
            <figure className="unk-look__figure">
              <span className="unk-look__well">
                {/* sized to the slot it fills (lookbook-styles.css): up to 320px wide below 840px,
                    larger screens clamp(360px, 58vh, 600px) tall at the photo's own ratio, so no
                    file is decoded at more than ~2x its display size. (No "vw" in here: Next then
                    offers its smaller widths too.) */}
                <Image className="unk-look__img" src={l.src} alt={l.product ? `Look ${i + 1}: ${l.product.name}` : `UNKNOWN look ${i + 1}`}
                  width={l.width} height={l.height} decoding="async"
                  sizes={`(max-width: 839px) 320px, calc(clamp(360px, 58vh, 600px) * ${(l.width / l.height).toFixed(3)})`} />
              </span>
              {l.product && (
                <figcaption className="unk-look__cap">
                  <span className="unk-look__product">
                    <UnkLink href={l.product.url}>{l.product.name}</UnkLink>
                  </span>
                </figcaption>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
