"use client";

import { createElement, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Rack, { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import FocusView, { type FocusHandle } from "@/components/focus/FocusView";
import { unknownProducts } from "@/lib/unknown-products";
import { preloadFocus } from "@/lib/preload";

import { Search02, User02, ShoppingCart02 } from "./icon-paths";

function Icon({ paths }: { paths: typeof Search02 | typeof User02 | typeof ShoppingCart02 }) {
  return <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">{paths.map(([tag, attrs]) => createElement(tag, attrs))}</svg>;
}

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
        <a className="unknown-about" href="https://www.unk-nown.com/pages/about-unknown">About Us</a>
        <a className="unknown-wordmark" href="/unknown" aria-label="UNKNOWN home">UNKNOWN</a>
        {selection ? <button className="unknown-close" type="button" onClick={() => view.current?.close()}>Close <span aria-hidden="true">×</span></button> :
          <nav className="unknown-actions" aria-label="Store navigation">
            <a href="https://www.unk-nown.com/search" aria-label="Search"><Icon paths={Search02} /></a>
            <a href="https://www.unk-nown.com/account" aria-label="Account"><Icon paths={User02} /></a>
            <a href="https://www.unk-nown.com/cart" aria-label="Cart"><Icon paths={ShoppingCart02} /></a>
          </nav>}
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
