"use client";

/* Model images use next/image so they are served at display size with a srcset, exactly what
   `image_url` + `image_tag: widths:` produces in the Liquid version. The cloud layers stay plain
   <img> (already sized). */
/* eslint-disable @next/next/no-img-element */

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef } from "react";
import UnkLink from "../link/UnkLink";
import {
  PANTS_ATMOSPHERE, PANTS_BASE, PANTS_BODY, PANTS_CANVAS, PANTS_HANDS, PANTS_INTRO, PANTS_LABEL, PANTS_VIEW_ALL,
  PANTS_VIEW_PRODUCT, pants, type LayerBox,
} from "./pants.data";
import { initPantsSection } from "./pants-section-behaviour";
import "./pants-section.css";

const pad = (n: number) => String(n).padStart(2, "0");
/** One cropped layer, placed on the 3:4 canvas by percentages of the frame; its file is sized to
 *  its share of the frame width (the frame is ~90vw on portrait screens, ~60vh otherwise). */
function Layer({ src, box, style, ...rest }: { src: string; box: LayerBox } & Omit<ImageProps, "src" | "alt" | "width" | "height" | "sizes">) {
  const [x, y, w, h] = box;
  const f = w / PANTS_CANVAS.width;
  return (
    <Image className="unk-pants__layer" src={src} alt="" width={w} height={h} loading="eager"
      sizes={`(max-aspect-ratio: 5/4) ${Math.ceil(90 * f)}vw, ${Math.ceil(60 * f)}vh`}
      style={{
        left: `${((x / PANTS_CANVAS.width) * 100).toFixed(3)}%`,
        top: `${((y / PANTS_CANVAS.height) * 100).toFixed(3)}%`,
        width: `${(f * 100).toFixed(3)}%`,
        height: `${((h / PANTS_CANVAS.height) * 100).toFixed(3)}%`,
        ...style,
      }}
      {...rest} />
  );
}

/**
 * Pinned, scroll-scrubbed pants showcase (see HANDOFF.md). React only renders the markup; all
 * behaviour lives in pants-section-behaviour.js so the theme can load the same file.
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
          {/* a background, not an <img>: the soft mist is meant to stretch to the band */}
          <div className="unk-pants__edge-mist" style={{ backgroundImage: `url(${PANTS_ATMOSPHERE.mist})` }} />
        </div>

        <div className="unk-pants__stage" data-pants-stage>
          <div className="unk-pants__sky" aria-hidden="true">
            <img className="unk-pants__cloud unk-pants__cloud--back" data-cloud="back" src={PANTS_ATMOSPHERE.back} alt="" width={1600} height={700} />
            <img className="unk-pants__cloud unk-pants__cloud--front" data-cloud="front" src={PANTS_ATMOSPHERE.front} alt="" width={1600} height={500} />
          </div>

          {/* one fixed 3:4 canvas; every layer fills it identically. Bottom to top: the body (never
              moves or fades), the pants of each state (the base chinos, then each pair), the grey
              pants-only ghosts, and the hands, which stay in front of whatever pants are on. All
              eager: each is decoded right after load anyway (pants-section-behaviour.js), and any of
              them can become the largest image on screen. Low fetch priority for the pairs the entry
              doesn't show, so they never hold up the hero's photos on a slow phone. */}
          <div className="unk-pants__figure" aria-hidden="true">
            <Layer data-pants-body src={PANTS_BODY.src} box={PANTS_BODY.box} />
            <Layer data-pants-layer src={PANTS_BASE.src} box={PANTS_BASE.box} style={{ opacity: 1 }} />
            {pants.map((p, i) => (
              <Layer key={p.handle} data-pants-layer src={p.image} box={p.box}
                fetchPriority={i === 0 ? "auto" : "low"} style={{ opacity: 0 }} />
            ))}
            {/* grey copies: the ghost waiting at the right, sliding onto the body (pants only) */}
            {pants.map((p, i) => (
              <Layer key={p.handle} data-pants-grey src={p.grey} box={p.box}
                fetchPriority={i === 0 ? "auto" : "low"} style={{ opacity: i === 0 ? "var(--peek-opacity)" : 0 }} />
            ))}
            <Layer data-pants-hands src={PANTS_HANDS.src} box={PANTS_HANDS.box} />
          </div>
          {/* soft mist over the waist, where the crop fades out */}
          <div className="unk-pants__mist" data-cloud="mist" style={{ backgroundImage: `url(${PANTS_ATMOSPHERE.mist})` }} aria-hidden="true" />
          <button type="button" className="unk-pants__peek-hit" data-pants-peek tabIndex={-1} aria-hidden="true" />

          {/* details, top to bottom: PANTS eyebrow, name, price, View product */}
          <h2 id="unk-pants-title" className="unk-pants__label">{PANTS_LABEL}</h2>
          <article className="unk-pants__item" data-pants-item style={{ opacity: 1 }}>
            <div className="unk-pants__info">
              <h3 className="unk-pants__name" data-pants-name>{PANTS_INTRO.title}</h3>
              <p className="unk-pants__meta" data-pants-fade>{PANTS_INTRO.meta}</p>
            </div>
          </article>
          {pants.map((p) => (
            <article key={p.handle} className="unk-pants__item" data-pants-item data-url={p.url} data-name={p.name}
              aria-hidden inert style={{ opacity: 0 }}>
              <div className="unk-pants__info">
                <h3 className="unk-pants__name" data-pants-name>{p.display}</h3>
                <p className="unk-pants__price" data-pants-fade>{p.price}</p>
              </div>
            </article>
          ))}

          {/* the one link to a pair: under the price of the pair on screen; pants-section-behaviour.js
              moves it to that pair's text, points it at that pair and cross-fades it with the price */}
          <span className="unk-pants__view" data-pants-view style={{ opacity: 0 }}>
            <UnkLink href={pants[0]?.url ?? PANTS_VIEW_ALL.url} data-pants-cta aria-label={`View ${pants[0]?.name}`}
              tabIndex={-1} aria-hidden="true">{PANTS_VIEW_PRODUCT}</UnkLink>
          </span>

          {/* bottom row: counter, progress and arrows on the left, the collection link on the right
              (last in the tab order: View product, previous, next, View all) */}
          <div className="unk-pants__nav">
            <p className="unk-pants__count" aria-hidden="true">
              <span data-pants-current>—</span> / {pad(pants.length)}
            </p>
            <span className="unk-pants__progress" aria-hidden="true"><span data-pants-progress /></span>
            <button type="button" className="unk-icon-btn unk-state" data-pants-prev aria-label="Previous pants" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="unk-icon-btn unk-state" data-pants-next aria-label="Next pants">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <span className="unk-pants__all"><UnkLink href={PANTS_VIEW_ALL.url}>{PANTS_VIEW_ALL.label}</UnkLink></span>
          </div>
          <p className="unk-sr" aria-live="polite" data-pants-status />
        </div>
      </section>
    </>
  );
}
