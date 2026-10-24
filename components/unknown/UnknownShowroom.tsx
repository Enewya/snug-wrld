"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Rack, { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import FocusView, { type FocusHandle } from "@/components/focus/FocusView";
import { unknownProducts } from "@/lib/unknown-products";
import { preloadFocus } from "@/lib/preload";

import { UNKNOWN_LOGO } from "@/lib/unknown-brand";

type Selection = { start: number; origin: RackOrigin; key: number };
const keepWhite = () => {};

export default function UnknownShowroom() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const view = useRef<FocusHandle>(null);
  const browse = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      unknownProducts.forEach(p => void preloadFocus(p.front));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  const open = useCallback((start: number, origin: RackOrigin) => {
    setSelection({ start, origin, key: Date.now() });
    setShown(start);
    setActive(true);
  }, []);
  const closed = useCallback(() => {
    setSelection(null);
    setShown(null);
    document.querySelector<HTMLAnchorElement>(".unknown-wordmark")?.focus({ preventScroll: true });
  }, []);
  const closeStart = useCallback(() => setActive(false), []);
  const getOrigin = useCallback((i: number) => rackOrigin(i), []);

  return (
    <div className="unknown-showroom">
      <header className="unknown-header">
        <a className="unknown-about" href="https://www.unk-nown.com/pages/about-unknown">About</a>
        <a className="unknown-wordmark" href="/unknown" aria-label="UNKNOWN home">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG wordmark, swapped by file */}
          <img src={UNKNOWN_LOGO.src} width={UNKNOWN_LOGO.width} height={UNKNOWN_LOGO.height} alt={UNKNOWN_LOGO.alt} />
        </a>
        {selection ? <button className="unknown-close" type="button" onClick={() => view.current?.close()}>Close <span aria-hidden="true">×</span></button> :
          <a className="unknown-contact" href="#visit">Contact</a>}
      </header>
      <div className="unknown-wall" aria-hidden="true" />
      <main>
        <h1 className="sr-only">UNKNOWN — eleven tops, three views</h1>
        <motion.div className="unknown-rack-wrap" inert={!!selection}
          initial={false}
          animate={active ? { filter: "blur(8px)", opacity: 0.25 } : { filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 0.5 }}>
          <Rack products={unknownProducts} onSelect={open} hiddenIndex={shown} paused={!!selection} />
        </motion.div>
        {!selection && <div className="unknown-intro">
          <label className="sr-only" htmlFor="unknown-piece">Choose a piece to explore</label>
          <select id="unknown-piece" ref={browse} value="" onChange={e => {
            const i = Number(e.target.value);
            const origin = rackOrigin(i);
            if (origin) open(i, origin);
          }}>
            <option value="" disabled>Explore the collection</option>
            {unknownProducts.map((p, i) => <option key={p.slug} value={i}>{p.name}</option>)}
          </select>
        </div>}
        {selection && <FocusView key={selection.key} ref={view} products={unknownProducts}
          start={selection.start} origin={selection.origin} getOrigin={getOrigin}
          onIndex={setShown} onTint={keepWhite} onCloseStart={closeStart} onClosed={closed} />}
      </main>
    </div>
  );
}
