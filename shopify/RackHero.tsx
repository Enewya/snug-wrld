/**
 * The Shopify counterpart of components/Showroom.tsx: the rack in the section, and on a click the
 * same detail view as the Snug Wrld site. The theme has its own header, so the detail view brings
 * its own CLOSE ✕, and it opens over the whole page (in a portal, clear of the theme's stacking).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import Rack, { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import FocusView, { type FocusHandle } from "@/components/focus/FocusView";
import { preloadFrontsWhenIdle } from "./preload";

type Focus = { start: number; origin: RackOrigin; key: number };

type Props = {
  /** The section's wall colour (the detail view lives outside the section). */
  paper: string;
  /** Tint the section's wall toward the colourway (null: the plain wall), like the Snug site's page. */
  onWall: (colour: string | null) => void;
};

export default function RackHero({ paper, onWall }: Props) {
  const [focus, setFocus] = useState<Focus | null>(null);
  /** Detail view showing (false again as soon as it starts closing). */
  const [active, setActive] = useState(false);
  /** Product in the detail view: hidden on the rack until it has flown back. */
  const [shown, setShown] = useState<number | null>(null);
  const [wall, setWall] = useState<string | null>(null);
  const view = useRef<FocusHandle>(null);
  /** Colourway each garment hangs in: a swing tag picked in the detail view stays picked on the rack. */
  const [colours, setColours] = useState<Record<number, number>>({});
  const coloursRef = useRef(colours);
  useEffect(() => {
    coloursRef.current = colours;
  }, [colours]);
  const colourOf = useCallback((i: number) => coloursRef.current[i] ?? 0, []);
  const onColour = useCallback(
    (i: number, c: number) => setColours((m) => (m[i] === c || (m[i] === undefined && c === 0) ? m : { ...m, [i]: c })),
    [],
  );

  useEffect(() => preloadFrontsWhenIdle(), []);

  useEffect(() => {
    onWall(wall);
  }, [onWall, wall]);

  // the Snug header fades while the view is open (rack-hero.css)
  useEffect(() => {
    document.documentElement.classList.toggle("rack-hero-open", active);
  }, [active]);

  // no page scroll behind the open view
  useEffect(() => {
    if (!focus) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [focus]);

  // added to the cart: the garment flies back to the rail (and the theme's cart drawer opens, if any)
  useEffect(() => {
    const onAdded = () => {
      view.current?.close();
      const drawer = document.querySelector<HTMLElement & { open?: () => void }>("cart-drawer-component");
      // the theme's drawer if the page has one; otherwise the Snug header's cart count shows the add
      if (drawer?.open) drawer.open();
    };
    document.addEventListener("rack-hero:added", onAdded);
    return () => document.removeEventListener("rack-hero:added", onAdded);
  }, []);

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
    <>
      {/* the rack stays where it is, blurred and faded behind the detail view, as on the Snug site */}
      <motion.div
        className="rack-hero-rack"
        initial={false}
        animate={active ? { filter: "blur(8px)", opacity: 0.5 } : { filter: "blur(0px)", opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Rack onSelect={open} hiddenIndex={shown} paused={!!focus} colours={colours} />
      </motion.div>
      {focus &&
        createPortal(
          <div className="rack-hero-focus" data-active={active || undefined} style={{ "--paper": paper, "--wall": wall ?? paper } as React.CSSProperties}>
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
              colourOf={colourOf}
              onColour={onColour}
            />
            <button
              type="button"
              className="rack-hero-close"
              onClick={() => view.current?.close()}
              aria-label="Close detail view"
              tabIndex={active ? undefined : -1}
            >
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
