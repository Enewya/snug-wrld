"use client";

import { useEffect, useRef } from "react";
import { DROP } from "./drop-band.data";
import { initDropBand } from "./drop-band";
import "./drop-band.css";

/** Type-only campaign band for the current drop (dark, full width). */
export default function DropBand() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initDropBand(ref.current) : undefined), []);
  const [first, ...rest] = DROP.title.split(" ");
  return (
    <section ref={ref} className="unk-drop" aria-labelledby="unk-drop-title">
      <div className="unk-wrap unk-drop__top">
        <span className="unk-head__label unk-drop__label">{DROP.label}</span>
      </div>
      <h2 id="unk-drop-title" className="unk-drop__title">
        <span data-drift="-6">{first}</span>
        <span data-drift="6">{rest.join(" ")}</span>
      </h2>
      <div className="unk-wrap unk-drop__bottom">
        <a className="unk-link" href={DROP.link.url}>{DROP.link.text} <span aria-hidden="true">→</span></a>
      </div>
    </section>
  );
}
