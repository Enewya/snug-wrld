"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import UnkLink from "../link/UnkLink";
import { LOOKBOOK, looks } from "./lookbook.data";
import { initLookbook } from "./lookbook";
import "./lookbook.css";

const pad = (n: number) => String(n).padStart(2, "0");

/** Lookbook: one editorial row of real looks, swipeable, prev/next buttons, captions per look. */
export default function Lookbook() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initLookbook(ref.current) : undefined), []);
  return (
    <section ref={ref} className="unk-lookbook" aria-labelledby="unk-lookbook-title">
      <div className="unk-wrap">
        <header className="unk-head">
          <div>
            <span className="unk-head__label">{LOOKBOOK.label}</span>
            <h2 id="unk-lookbook-title" className="unk-head__title">{LOOKBOOK.title}</h2>
          </div>
          <div className="unk-lookbook__actions">
            <button type="button" className="unk-icon-btn" data-look-prev aria-label="Previous look" aria-disabled="true">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="unk-icon-btn" data-look-next aria-label="Next look">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true"><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <UnkLink href={LOOKBOOK.pageUrl}>View all</UnkLink>
          </div>
        </header>
      </div>
      <ul className="unk-lookbook__row" data-look-row role="list" tabIndex={0} aria-label="Looks (scroll sideways)">
        {looks.map((l, i) => (
          <li key={l.src} className="unk-look" style={{ "--ar": `${l.width} / ${l.height}` } as React.CSSProperties}>
            <figure className="unk-look__figure">
              <span className="unk-look__well">
                <Image className="unk-look__img" src={l.src} alt={l.product ? `Look ${i + 1}: ${l.product.name}` : `UNKNOWN look ${i + 1}`}
                  width={l.width} height={l.height} sizes="(max-width: 767px) 62vw, 32vw" />
              </span>
              <figcaption className="unk-look__cap">
                <span className="unk-look__num">Look {pad(i + 1)}</span>
                {l.product && (
                  <span className="unk-look__product">
                    <UnkLink href={l.product.url}>{l.product.name}</UnkLink>
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
