"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Rack, { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import FocusView, { type FocusHandle } from "@/components/focus/FocusView";
import { unknownProducts } from "@/lib/unknown-products";
import { preloadFocus } from "@/lib/preload";
import UnknownHeader from "./header/UnknownHeader";
import MobileRack, { type MobileRackHandle } from "./mobile-rack/MobileRack";

type Selection = { start: number; origin: RackOrigin; key: number };
const keepWhite = () => {};
/** Compact window class (M3): the mobile rack is shown instead of the desktop rack. */
const compact = () => window.matchMedia("(max-width: 599px)").matches;

export default function UnknownShowroom() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const view = useRef<FocusHandle>(null);
  const browse = useRef<HTMLSelectElement>(null);
  const mobile = useRef<MobileRackHandle>(null);

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
    if (compact()) mobile.current?.resume();
    document.querySelector<HTMLAnchorElement>(".unknown-wordmark")?.focus({ preventScroll: true });
  }, []);
  const closeStart = useCallback(() => setActive(false), []);
  // the focus view flies back to the rack that is on screen; on phones the rack first centres the
  // piece being shown (it is hidden behind the focus view), so the flight ends in view
  const getOrigin = useCallback((i: number) => (compact() ? mobile.current?.origin(i) ?? null : rackOrigin(i)), []);
  const onIndex = useCallback((i: number) => {
    setShown(i);
    if (compact()) mobile.current?.jumpTo(i);
  }, []);

  return (
    <div className="unknown-showroom">
      <UnknownHeader close={selection ? (
        <button className="unknown-close" type="button" onClick={() => view.current?.close()}>Close <span aria-hidden="true">×</span></button>
      ) : undefined} />
      <div className="unknown-wall" aria-hidden="true" />
      <main>
        <h1 className="sr-only">UNKNOWN — the rack: eight pieces, three views</h1>
        <motion.div className="unknown-rack-wrap" inert={!!selection}
          initial={false}
          animate={active ? { filter: "blur(8px)", opacity: 0.25 } : { filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}>
          <div className="unknown-rack-desktop">
            <Rack products={unknownProducts} onSelect={open} hiddenIndex={shown} paused={!!selection} />
          </div>
          <div className="unknown-rack-mobile">
            <MobileRack ref={mobile} products={unknownProducts} onSelect={open} hiddenIndex={shown} />
          </div>
        </motion.div>
        {!selection && <div className="unknown-intro">
          <label className="sr-only" htmlFor="unknown-piece">Choose a piece to explore</label>
          <select id="unknown-piece" ref={browse} value="" onChange={e => {
            const i = Number(e.target.value);
            const origin = getOrigin(i);
            if (origin) open(i, origin);
          }}>
            <option value="" disabled>Explore the collection</option>
            {unknownProducts.map((p, i) => <option key={p.slug} value={i}>{p.name}</option>)}
          </select>
        </div>}
        {selection && <FocusView key={selection.key} ref={view} products={unknownProducts}
          start={selection.start} origin={selection.origin} getOrigin={getOrigin}
          onIndex={onIndex} onTint={keepWhite} onCloseStart={closeStart} onClosed={closed} />}
      </main>
    </div>
  );
}
