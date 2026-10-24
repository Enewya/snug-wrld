"use client";

/* Plain <img> on purpose: this markup mirrors the Shopify Liquid section one to one, where
   images come from Shopify's CDN, not next/image. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { PANTS_BASE_IMAGE, PANTS_LABEL, pants } from "./pants.data";
import { initPantsSection } from "./pants-section";
import "./pants-section.css";

const pad = (n: number) => String(n).padStart(2, "0");
const IMG = { width: 1086, height: 1448, decoding: "async" as const };

/**
 * Pinned, scroll-scrubbed pants showcase (see HANDOFF.md). React only renders the markup; all
 * behaviour lives in pants-section.js so the theme can load the same file.
 */
export default function PantsSection() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initPantsSection(ref.current) : undefined), []);

  return (
    <section
      ref={ref}
      className="unk-pants"
      aria-labelledby="unk-pants-title"
      style={{ "--unk-pants-count": pants.length } as React.CSSProperties}
    >
      <div className="unk-pants__stage" data-pants-stage>
        <div className="unk-pants__wall" aria-hidden="true" />
        <h2 id="unk-pants-title" className="unk-pants__label">{PANTS_LABEL}</h2>

        {/* one fixed 3:4 frame; every layer fills it identically (no per-product sizing) */}
        <div className="unk-pants__figure" aria-hidden="true">
          <img className="unk-pants__layer" data-pants-base src={PANTS_BASE_IMAGE} alt="" {...IMG} style={{ opacity: 0 }} />
          {pants.map((p, i) => (
            <img key={p.handle} className="unk-pants__layer" data-pants-layer src={p.image} alt="" {...IMG}
              loading={i < 2 ? "eager" : "lazy"} style={{ opacity: i === 0 ? 1 : 0 }} />
          ))}
          {/* grey copies: the peek at the right at rest, the ghost while a pair slides in */}
          {pants.map((p, i) => (
            <img key={p.handle} className="unk-pants__layer" data-pants-grey src={p.grey} alt="" {...IMG}
              loading={i < 2 ? "eager" : "lazy"} style={{ opacity: i === 1 ? "var(--peek-opacity)" : 0 }} />
          ))}
        </div>
        <button type="button" className="unk-pants__peek-hit" data-pants-peek tabIndex={-1} aria-hidden="true" />

        {pants.map((p, i) => (
          <article key={p.handle} className="unk-pants__item" data-pants-item
            aria-hidden={i !== 0} inert={i !== 0} style={{ opacity: i === 0 ? 1 : 0 }}>
            <div className="unk-pants__info">
              <h3 className="unk-pants__name" data-pants-name>{p.display}</h3>
              <p className="unk-pants__price" data-pants-fade>{p.price}</p>
              <a className="unk-pants__link" data-pants-fade href={p.url}>
                View product <span aria-hidden="true">→</span>
              </a>
            </div>
            <div className="unk-pants__buy" data-pants-buy>
              <img className="unk-pants__thumb" src={p.image} alt="" {...IMG} loading="lazy" />
              <span className="unk-pants__buy-name">{p.name}</span>
              <span className="unk-pants__buy-price">{p.price}</span>
              <a className="unk-pants__cart" href={p.url} aria-label={`Add to cart: ${p.name}, ${p.price}`}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                  <path d="M5 8h14l-1 12H6L5 8Z M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                Add to cart
              </a>
            </div>
          </article>
        ))}

        <div className="unk-pants__nav">
          <p className="unk-pants__count" aria-hidden="true">
            <span data-pants-current>{pad(1)}</span> / {pad(pants.length)}
          </p>
          <span className="unk-pants__progress" aria-hidden="true"><span data-pants-progress /></span>
          <button type="button" className="unk-pants__arrow" data-pants-prev aria-label="Previous pants" aria-disabled="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="unk-pants__arrow" data-pants-next aria-label="Next pants">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <p className="unk-sr" aria-live="polite" data-pants-status />
      </div>
    </section>
  );
}
