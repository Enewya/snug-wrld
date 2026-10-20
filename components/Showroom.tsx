"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/shell/Header";
import Marquee from "@/components/shell/Marquee";
import AvailabilityPill from "@/components/shell/AvailabilityPill";
import Rack, { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import FocusView, { type FocusHandle } from "@/components/focus/FocusView";

type Focus = { start: number; origin: RackOrigin; key: number };

export default function Showroom() {
  const [focus, setFocus] = useState<Focus | null>(null);
  /** Focus view showing (false again as soon as it starts closing). */
  const [active, setActive] = useState(false);
  /** Product in the focus view: hidden on the rack until it has flown back. */
  const [shown, setShown] = useState<number | null>(null);
  const [wall, setWall] = useState<string | null>(null);
  const view = useRef<FocusHandle>(null);

  const open = useCallback((i: number, origin: RackOrigin) => {
    setFocus({ start: i, origin, key: Date.now() });
    setShown(i);
    setActive(true);
  }, []);
  const getOrigin = useCallback((i: number) => rackOrigin(i), []);
  const onCloseStart = useCallback(() => setActive(false), []);
  const onClosed = useCallback(() => {
    setFocus(null);
    setShown(null);
  }, []);

  return (
    <div className="wall relative h-dvh w-full overflow-hidden" style={wall ? { backgroundColor: wall } : undefined}>
      <Header focus={active} onClose={() => view.current?.close()} />
      <main>
        <h1 className="sr-only">Snug Wrld</h1>
        {/* the rack stays where it is, blurred and faded behind the focus view (bm-10) */}
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={active ? { filter: "blur(8px)", opacity: 0.25 } : { filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Rack onSelect={open} hiddenIndex={shown} paused={!!focus} />
        </motion.div>
        <AvailabilityPill hidden={!!focus} />
        {focus && (
          <FocusView
            key={focus.key}
            ref={view}
            start={focus.start}
            origin={focus.origin}
            getOrigin={getOrigin}
            onIndex={setShown}
            onTint={setWall}
            onCloseStart={onCloseStart}
            onClosed={onClosed}
          />
        )}
      </main>
      <Marquee />
    </div>
  );
}
