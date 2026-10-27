"use client";

/* eslint-disable @next/next/no-img-element -- plain 1x / 2x srcset, the same markup as the Liquid section */
import { useEffect, useRef } from "react";
import UnkLink from "../link/UnkLink";
import { SLIDES } from "./slides.data";
import { initSlides } from "./slides-behaviour";
import "./slides-styles.css";

/**
 * Slides: one product, calm. Mirrors Two Piece (its photo is on the left, this one's on the right).
 * A light neutral panel (12px radius, one tone off white) holds the cut-out pair; a Pair / Strap
 * toggle crossfades to the strap's script; on hover devices the pair tilts very slightly with the
 * pointer. Behaviour: slides-behaviour.js. Liquid notes: components/unknown/HANDOFF.md ("Slides").
 */
export default function Slides() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => (root.current ? initSlides(root.current) : undefined), []);
  return (
    <section ref={root} className="unk-section unk-slides" aria-labelledby="unk-slides-title">
      <div className="unk-wrap unk-slides__grid">
        <div className="unk-slides__details" data-reveal>
          <span className="unk-slides__label">{SLIDES.label}</span>
          <h2 id="unk-slides-title" className="unk-slides__name">{SLIDES.name}</h2>
          <p className="unk-slides__price">{SLIDES.price}</p>
          <div className="unk-slides__toggle" role="group" aria-label="View">
            {SLIDES.views.map((v, i) => (
              <button key={v.key} type="button" className="unk-slides__opt" data-slides-opt={i} aria-pressed={i === 0}>{v.toggle}</button>
            ))}
          </div>
          <span className="unk-slides__link"><UnkLink href={SLIDES.url}>{SLIDES.linkText}</UnkLink></span>
        </div>
        <div className="unk-slides__panel" data-slides-panel>
          <div className="unk-slides__tilt" data-slides-tilt>
            {SLIDES.views.map((v, i) => (
              <img key={v.key} className="unk-slides__img" data-slides-view={i} data-on={i === 0 ? "" : undefined}
                src={v.src} srcSet={v.src2x ? `${v.src} 1x, ${v.src2x} 2x` : undefined}
                width={v.width} height={v.height} alt={v.alt} aria-hidden={i !== 0}
                loading="lazy" decoding="async" draggable={false} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
