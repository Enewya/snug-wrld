"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";
import FocusGarment, { hemOf } from "./FocusGarment";
import InfoStack from "./InfoStack";
import SwingTags from "./SwingTags";
import { products } from "@/lib/products";
import { tint } from "@/lib/dyeDip";
import { useHangerSpring } from "@/lib/useHangerSpring";
import type { RackOrigin } from "@/components/rack/Rack";

export type FocusHandle = { close: () => void };

type Props = {
  start: number;
  origin: RackOrigin;
  /** Rack slot to fly back to (read at close time). */
  getOrigin: (index: number) => RackOrigin | null;
  /** The product now shown (the rack hides it). */
  onIndex: (index: number) => void;
  /** Wall colour (9% toward the colourway), or null for the plain wall. */
  onTint: (colour: string | null) => void;
  /** Close started: header, pill and rack come back. */
  onCloseStart: () => void;
  /** Garment is back on its hook. */
  onClosed: () => void;
};

const HOVER_BODY_SCALE = 1.12; // must match RackItem
const FLIGHT = { type: "spring", stiffness: 70, damping: 15, mass: 1 } as const;
const SWIPE_PX = 50;
/** FRONT ⇄ BACK: half a turn about the hook, edge-on (and the face swap) exactly at the midpoint. */
const FLIP = { duration: 0.5, ease: "easeInOut" } as const;

/** Showing the back? (angle 0 = front, 180 = back, any number of whole turns) */
const showsBack = (a: number) => {
  const n = ((a % 360) + 360) % 360;
  return n > 90 && n < 270;
};

function ArrowIcon({ dir }: { dir: "l" | "r" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ transform: dir === "l" ? "scaleX(-1)" : undefined }}>
      <path d="M3 9h11.5M10 4.5 14.5 9 10 13.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Status = "opening" | "open" | "closing";

/** Hem depth below the hanging point (× --fiw) for a product view: the lower of front and back. */
const hemOfView = (v: { front: string; back?: string }) => Math.max(hemOf(v.front), v.back ? hemOf(v.back) : 0);
/** The deepest hem of any product: sizes the garment so the info stack always fits above the marquee. */
const HEM_MAX = Math.max(...products.flatMap((p) => (p.colourways ?? [p]).map(hemOfView)));

const FocusView = forwardRef<FocusHandle, Props>(function FocusView(
  { start, origin, getOrigin, onIndex, onTint, onCloseStart, onClosed },
  ref,
) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(start);
  const [colour, setColour] = useState(0);
  const [dye, setDye] = useState<{ from: string; to: string; back: boolean; toIndex: number; key: number } | null>(null);
  /** FRONT / BACK pill. Changes only on a pill click (animated) or a product switch (instant reset). */
  const [pill, setPill] = useState<{ face: "front" | "back"; animate: boolean }>({ face: "front", animate: false });
  const [flipping, setFlipping] = useState(false);
  const [status, setStatus] = useState<Status>("opening");
  const statusRef = useRef<Status>("opening");
  const setStat = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
  };

  const product = products[index];
  const way = product.colourways?.[colour];
  const view = way ?? product;

  // motion: flight (x, y, s), open/close turn (phase), front/back turn (angle), pendulum (swing)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const s = useMotionValue(1);
  const slide = useMotionValue(0);
  const fade = useMotionValue(1);
  const phase = useMotionValue(origin.hovered ? 180 : 0);
  const angle = useMotionValue(0);
  const swing = useMotionValue(0);
  const bodyScale = useMotionValue(origin.hovered ? HOVER_BODY_SCALE : 1);
  const { springTo, stop } = useHangerSpring(angle, swing, reduce);
  const anchorRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const flights = useRef<AnimationPlaybackControls[]>([]);

  /** Offset + scale that put the focus anchor exactly on a rack slot. */
  const toSlot = useCallback((o: RackOrigin) => {
    const a = anchorRef.current!;
    // layout position of the anchor, ignoring its own (animated) transform
    const parent = (a.offsetParent as HTMLElement).getBoundingClientRect();
    const left = parent.left + a.offsetLeft;
    const top = parent.top + a.offsetTop;
    const fiw = parseFloat(getComputedStyle(a).getPropertyValue("--fiw-px")) || 1;
    // focus anchor = middle of the loop's gap; on the rack that point is the rod's centre line
    return { dx: o.x - left, dy: o.y + o.rod / 2 - top, k: o.iw / fiw };
  }, []);

  const fly = useCallback((to: { x: number; y: number; s: number; phase: number; body: number }, then: () => void) => {
    flights.current.forEach((f) => f.stop());
    const opts = reduce ? { duration: 0 } : FLIGHT;
    flights.current = [
      animate(x, to.x, opts),
      animate(y, to.y, opts),
      animate(s, to.s, opts),
      animate(bodyScale, to.body, opts),
      animate(phase, to.phase, reduce ? { duration: 0 } : { type: "spring", stiffness: 60, damping: 14 }),
    ];
    Promise.all(flights.current.map((f) => f.finished)).then(then, () => {});
  }, [reduce, x, y, s, bodyScale, phase]);

  // open: start on the rack slot, fly to the centre turning to face front
  const opened = useRef(false);
  useEffect(() => {
    if (opened.current) return; // once (StrictMode runs effects twice in dev)
    opened.current = true;
    const { dx, dy, k } = toSlot(origin);
    if (reduce) {
      fade.set(0);
      phase.set(180);
      bodyScale.set(1);
      animate(fade, 1, { duration: 0.3 }).finished.then(() => setStat("open"));
      return;
    }
    x.set(dx);
    y.set(dy);
    s.set(k);
    fly({ x: 0, y: 0, s: 1, phase: 180, body: 1 }, () => setStat("open"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => onIndex(index), [index, onIndex]);
  useEffect(() => onTint(way ? tint(way.hex) : null), [way, onTint]);

  const close = useCallback(() => {
    if (statusRef.current === "closing") return;
    setStat("closing");
    stop();
    setDye(null);
    onCloseStart();
    onTint(null);
    const o = getOrigin(index);
    if (reduce || !o) {
      animate(fade, 0, { duration: reduce ? 0.25 : 0.2 }).finished.then(onClosed);
      return;
    }
    springTo(0, { kick: 2 });
    const { dx, dy, k } = toSlot(o);
    fly({ x: dx, y: dy, s: k, phase: 0, body: 1 }, onClosed);
  }, [getOrigin, index, onCloseStart, onClosed, onTint, reduce, springTo, stop, toSlot, fly, fade]);

  useImperativeHandle(ref, () => ({ close }), [close]);

  // switch piece: turn away to profile while sliding out, swap, slide in from the other side and turn in
  const go = useCallback(
    (d: 1 | -1) => {
      if (statusRef.current !== "open" || busy.current) return;
      busy.current = true;
      setDye(null);
      // the next piece opens on its front: reset the pill now, instantly, before anything moves
      setPill({ face: "front", animate: false });
      const next = (index + d + products.length) % products.length;
      if (reduce) {
        animate(fade, 0, { duration: 0.15 }).finished.then(() => {
          setIndex(next);
          setColour(0);
          angle.set(0);
          animate(fade, 1, { duration: 0.2 }).finished.then(() => (busy.current = false));
        });
        return;
      }
      const w = window.innerWidth;
      animate(slide, -d * w * 0.35, { type: "spring", stiffness: 140, damping: 22 });
      const out = Math.round(angle.get() / 180) * 180 + (d > 0 ? -90 : 90);
      springTo(out, {
        eps: 6,
        onDone: () => {
          setIndex(next);
          setColour(0);
          angle.set(d > 0 ? 90 : -90);
          slide.set(d * w * 0.35);
          animate(slide, 0, { type: "spring", stiffness: 140, damping: 22 });
          springTo(0, { kick: d * 4, eps: 4, onDone: () => (busy.current = false) });
        },
      });
    },
    [index, reduce, springTo, angle, slide, fade],
  );

  /** Turn to the front or back photo: half a turn about the hook (the faces swap exactly at 90°),
   *  then a small pendulum settle. Resolves when the turn is done. */
  const flip = useCallback(
    (toBack: boolean) => {
      if (toBack === showsBack(angle.get())) return Promise.resolve();
      stop();
      const target = angle.get() + 180; // always the same way round
      if (reduce) {
        angle.set(target);
        return Promise.resolve();
      }
      setFlipping(true);
      return animate(angle, target, FLIP).finished.then(() => {
        setFlipping(false);
        springTo(target, { kick: 3 });
      });
    },
    [angle, reduce, springTo, stop],
  );

  // FRONT / BACK pill
  const face = useCallback(
    (back: boolean) => {
      if (statusRef.current !== "open" || busy.current || !view.back) return;
      busy.current = true;
      setPill({ face: back ? "back" : "front", animate: true });
      flip(back).then(() => (busy.current = false));
    },
    [view.back, flip],
  );

  // colourway: dye-dip the new photo up from the hem on whichever face is showing, then swap
  const pick = useCallback(
    (i: number) => {
      if (!product.colourways || i === colour || busy.current || statusRef.current !== "open") return;
      const ways = product.colourways;
      const to = ways[i];
      const back = pill.face === "back" && !!ways[colour].back && !!to.back;
      onTint(tint(to.hex));
      if (reduce) {
        setColour(i);
        return;
      }
      busy.current = true;
      setDye({
        from: back ? ways[colour].back! : ways[colour].front,
        to: back ? to.back! : to.front,
        back,
        toIndex: i,
        key: Date.now(),
      });
      springTo(angle.get(), { kick: 2.5 });
    },
    [product.colourways, colour, angle, springTo, onTint, reduce, pill.face],
  );
  const dyeDone = useCallback(() => {
    if (!dye) return;
    // the old photo unmounts now; the dip keeps showing the new one for a few frames while its
    // own face takes over, then unmounts too
    setColour(dye.toIndex);
    const key = dye.key;
    setTimeout(() => {
      setDye((d) => (d && d.key === key ? null : d));
      busy.current = false;
    }, 160);
  }, [dye]);

  // keys
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, go]);

  // background: tap closes, horizontal swipe changes piece
  const bg = useRef<{ x: number; y: number } | null>(null);
  const onBgDown = (e: React.PointerEvent) => (bg.current = { x: e.clientX, y: e.clientY });
  /** Horizontal swipe → next / previous piece. Returns whether it was a swipe. */
  const swiped = (e: React.PointerEvent) => {
    const b = bg.current;
    bg.current = null;
    if (!b) return false;
    const dx = e.clientX - b.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - b.y)) {
      go(dx < 0 ? 1 : -1);
      return true;
    }
    return false;
  };
  const onBgUp = (e: React.PointerEvent) => {
    if (!swiped(e)) close();
  };


  const shown = status === "open";

  return (
    <div
      className="focus"
      data-status={status}
      style={{ "--hem": hemOfView(view), "--hem-max": HEM_MAX } as React.CSSProperties}
    >
      <div className="focus-backdrop" onPointerDown={onBgDown} onPointerUp={onBgUp} />

      {/* flight transform only while flying: once open the garment layers raster at full size */}
      <motion.div
        className="focus-anchor"
        ref={anchorRef}
        style={{ x, y, scale: s, opacity: fade, willChange: status === "open" ? "auto" : "transform" }}
      >
        <motion.div className="focus-slide" style={{ x: slide }}>
          <FocusGarment
            view={view}
            phase={phase}
            angle={angle}
            swing={swing}
            bodyScale={bodyScale}
            dye={dye}
            onDyeDone={dyeDone}
            moving={status !== "open" || flipping}
          />
          {/* the garment itself: a tap here doesn't close the view; a swipe still changes piece */}
          <div className="focus-garment-area" onPointerDown={onBgDown} onPointerUp={swiped} />
          {product.colourways && (
            <motion.div className="focus-tags-wrap" initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.3 }}>
              <SwingTags ways={product.colourways} active={dye ? dye.toIndex : colour} onPick={pick} />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        className="focus-arrow l"
        aria-label="Previous piece"
        onClick={() => go(-1)}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        style={{ pointerEvents: shown ? "auto" : "none" }}
      >
        <ArrowIcon dir="l" />
      </motion.button>
      <motion.button
        type="button"
        className="focus-arrow r"
        aria-label="Next piece"
        onClick={() => go(1)}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        style={{ pointerEvents: shown ? "auto" : "none" }}
      >
        <ArrowIcon dir="r" />
      </motion.button>

      <motion.div className="focus-info" initial={{ opacity: 0 }} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.3 }}>
        <InfoStack
          name={product.name}
          url={product.url}
          face={pill.face}
          animateFace={pill.animate}
          hasBack={!!view.back}
          onFace={face}
        />
      </motion.div>
    </div>
  );
});

export default FocusView;
