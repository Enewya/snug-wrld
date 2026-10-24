"use client";

/* Model images use next/image so they are served at display size with a srcset, exactly what
   `image_url` + `image_tag: widths:` produces in the Liquid version. The thumbnail and the cloud
   layers stay plain <img> (tiny / already sized). */
/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useEffect, useRef } from "react";
import UnkLink from "../link/UnkLink";
import { PANTS_ATMOSPHERE, PANTS_BASE_IMAGE, PANTS_INTRO, PANTS_LABEL, pants } from "./pants.data";
import { initPantsSection } from "./pants-section";
import "./pants-section.css";

const pad = (n: number) => String(n).padStart(2, "0");
const MODEL = { width: 1086, height: 1448, sizes: "(max-width: 760px) 90vw, (max-aspect-ratio: 5/4) 70vw, 60vh" };

/**
 * Pinned, scroll-scrubbed pants showcase (see HANDOFF.md). React only renders the markup; all
 * behaviour lives in pants-section.js so the theme can load the same file.
 *
 * States: 0 = the model in the neutral base pants (intro), 1…N = each pair.
 */
export default function PantsSection() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initPantsSection(ref.current) : undefined), []);

  return (
    <>
      <section
        ref={ref}
        className="unk-pants"
        aria-labelledby="unk-pants-title"
        style={{ "--unk-pants-count": pants.length + 1 } as React.CSSProperties}
      >
        {/* feathered top edge: the hero shows through as the section rises over it */}
        <div className="unk-pants__feather" aria-hidden="true">
          <img className="unk-pants__edge-mist" src={PANTS_ATMOSPHERE.mist} alt="" width={1600} height={360} />
        </div>

        <div className="unk-pants__stage" data-pants-stage>
          <div className="unk-pants__sky" aria-hidden="true">
            <img className="unk-pants__cloud unk-pants__cloud--back" data-cloud="back" src={PANTS_ATMOSPHERE.back} alt="" width={1600} height={700} />
            <img className="unk-pants__cloud unk-pants__cloud--front" data-cloud="front" src={PANTS_ATMOSPHERE.front} alt="" width={1600} height={500} />
          </div>
          <h2 id="unk-pants-title" className="unk-pants__label">{PANTS_LABEL}</h2>

          {/* one fixed 3:4 frame; every layer fills it identically (no per-product sizing). All
              eager: each is decoded right after load anyway (pants-section.js), and any of them can
              become the largest image on screen as the visitor scrolls. */}
          <div className="unk-pants__figure" aria-hidden="true">
            <Image className="unk-pants__layer" data-pants-layer src={PANTS_BASE_IMAGE} alt="" {...MODEL} loading="eager" fetchPriority="high" style={{ opacity: 1 }} />
            {pants.map((p) => (
              <Image key={p.handle} className="unk-pants__layer" data-pants-layer src={p.image} alt="" {...MODEL}
                loading="eager" style={{ opacity: 0 }} />
            ))}
            {/* grey copies: the ghost waiting at the right, sliding onto the body */}
            {pants.map((p, i) => (
              <Image key={p.handle} className="unk-pants__layer" data-pants-grey src={p.grey} alt="" {...MODEL}
                loading="eager" style={{ opacity: i === 0 ? "var(--peek-opacity)" : 0 }} />
            ))}
          </div>
          {/* soft mist over the waist, where the crop fades out */}
          <img className="unk-pants__mist" data-cloud="mist" src={PANTS_ATMOSPHERE.mist} alt="" width={1600} height={360} aria-hidden="true" />
          <button type="button" className="unk-pants__peek-hit" data-pants-peek tabIndex={-1} aria-hidden="true" />

          <article className="unk-pants__item" data-pants-item style={{ opacity: 1 }}>
            <div className="unk-pants__info">
              <h3 className="unk-pants__name" data-pants-name>{PANTS_INTRO.title}</h3>
              <p className="unk-pants__meta" data-pants-fade>{PANTS_INTRO.meta}</p>
            </div>
          </article>
          {pants.map((p) => (
            <article key={p.handle} className="unk-pants__item" data-pants-item aria-hidden inert style={{ opacity: 0 }}>
              <div className="unk-pants__info">
                <h3 className="unk-pants__name" data-pants-name>{p.display}</h3>
                <p className="unk-pants__price" data-pants-fade>{p.price}</p>
                <span className="unk-pants__link" data-pants-fade><UnkLink href={p.url}>View product</UnkLink></span>
              </div>
              <div className="unk-pants__buy" data-pants-buy>
                <img className="unk-pants__thumb" src={p.image} alt="" width={1086} height={1448} loading="lazy" decoding="async" />
                <span className="unk-pants__buy-name">{p.name}</span>
                <a className="unk-pants__cart" href={p.url} aria-label={`Add to cart: ${p.name}`}>
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
              <span data-pants-current>—</span> / {pad(pants.length)}
            </p>
            <span className="unk-pants__progress" aria-hidden="true"><span data-pants-progress /></span>
            <button type="button" className="unk-icon-btn" data-pants-prev aria-label="Previous pants" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="unk-icon-btn" data-pants-next aria-label="Next pants">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <p className="unk-sr" aria-live="polite" data-pants-status />
        </div>
      </section>
      {/* the atmosphere fades out into the plain white of the sections below */}
      <div className="unk-pants-tail" aria-hidden="true" />
    </>
  );
}
