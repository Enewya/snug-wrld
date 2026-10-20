"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, type AnimationPlaybackControls } from "framer-motion";
import FocusGarment from "./FocusGarment";
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

type Status = "opening" | "open" | "closing";

const FocusView = forwardRef<FocusHandle, Props>(function FocusView(
  { start, origin, getOrigin, onIndex, onTint, onCloseStart, onClosed },
  ref,
) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(start);
  const [colour, setColour] = useState(0);
  const [dye, setDye] = useState<{ src: string; to: number; key: number } | null>(null);
  const [status, setStatus] = useState<Status>("opening");
  const statusRef = useRef<Status>("opening");
  const setStat = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
  };

  const product = products[index];
  const way = product.colourways?.[colour];
  const view = way ?? product;

  // motion: flight (x, y, s), open/close turn (phase), drag turn (angle), pendulum (swing)
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
      animate(fade, 1, { duration: 0.3 });
      setStat("open");
      return;
    }
    x.set(dx);
    y.set(dy);
    s.set(k);
    fly({ x: 0, y: 0, s: 1, phase: 180, body: 1 }, () => {
      setStat("open");
      // first-visit nudge: a small turn shows the piece can be moved
      setTimeout(() => {
        if (statusRef.current === "open" && !drag.current && !busy.current) springTo(35, { onDone: () => springTo(0) });
      }, 350);
    });
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

  // FRONT / BACK
  const face = useCallback(
    (back: boolean) => {
      if (statusRef.current !== "open" || busy.current) return;
      if (back && !view.back) {
        springTo(angle.get(), { kick: 5 }); // no back photo: just sway
        return;
      }
      const base = Math.round(angle.get() / 360) * 360;
      springTo(base + (back ? 180 : 0), { kick: 3 });
    },
    [view.back, springTo, angle],
  );

  // colourway: dye-dip the new photo up from the hem, then swap
  const pick = useCallback(
    (i: number) => {
      if (!product.colourways || i === colour || busy.current || statusRef.current !== "open") return;
      if (Math.abs(angle.get() % 360) > 1) springTo(Math.round(angle.get() / 360) * 360);
      const to = product.colourways[i];
      onTint(tint(to.hex));
      if (reduce) {
        setColour(i);
        return;
      }
      busy.current = true;
      setDye({ src: to.front, to: i, key: Date.now() });
      if (Math.abs(angle.get() % 360) <= 1) springTo(angle.get(), { kick: 2.5 });
    },
    [product.colourways, colour, angle, springTo, onTint, reduce],
  );
  const dyeDone = useCallback(() => {
    if (dye) setColour(dye.to);
    setDye(null);
    busy.current = false;
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

  // drag to turn (prototype)
  const drag = useRef<{ x: number; a: number; lastX: number; t: number; vel: number; id: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (statusRef.current !== "open" || busy.current) return;
    stop();
    drag.current = { x: e.clientX, a: angle.get(), lastX: e.clientX, t: performance.now(), vel: 0, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    const dx = e.clientX - d.x;
    d.vel = (e.clientX - d.lastX) / Math.max(1, now - d.t);
    d.lastX = e.clientX;
    d.t = now;
    let a = d.a + dx * 0.55;
    if (!view.back) {
      const off = a - d.a;
      a = d.a + Math.sign(off) * Math.min(70, Math.abs(off) * 0.5); // resist: no back to show
    }
    angle.set(a);
    swing.set(Math.max(-6, Math.min(6, -d.vel * 4)));
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const target = !view.back ? d.a : Math.round((angle.get() + d.vel * 220) / 180) * 180;
    springTo(target, { kick: -angle.get() * 0.02 });
  };

  // background: tap closes, horizontal swipe changes piece
  const bg = useRef<{ x: number; y: number } | null>(null);
  const onBgDown = (e: React.PointerEvent) => (bg.current = { x: e.clientX, y: e.clientY });
  const onBgUp = (e: React.PointerEvent) => {
    const b = bg.current;
    bg.current = null;
    if (!b) return;
    const dx = e.clientX - b.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - b.y)) go(dx < 0 ? 1 : -1);
    else close();
  };

  // FRONT/BACK knob follows the drag live (0 front … 1 back)
  const knob = useMotionValue(0);
  useMotionValueEvent(angle, "change", (a) => {
    const n = ((a % 360) + 360) % 360;
    knob.set(1 - Math.abs(((n / 180) % 2) - 1));
  });

  const shown = status === "open";

  return (
    <div className="focus" data-status={status}>
      <div className="focus-backdrop" onPointerDown={onBgDown} onPointerUp={onBgUp} />

      <motion.div className="focus-anchor" ref={anchorRef} style={{ x, y, scale: s, opacity: fade }}>
        <motion.div className="focus-slide" style={{ x: slide }}>
          <FocusGarment
            view={view}
            phase={phase}
            angle={angle}
            swing={swing}
            bodyScale={bodyScale}
            dye={dye}
            onDyeDone={dyeDone}
          />
          <div
            className="focus-hit"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            aria-label="Drag to rotate"
          />
          {product.colourways && (
            <motion.div className="focus-tags-wrap" initial={false} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.3 }}>
              <SwingTags ways={product.colourways} active={dye ? dye.to : colour} onPick={pick} />
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
        ←
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
        →
      </motion.button>

      <motion.div className="focus-info" initial={{ opacity: 0 }} animate={{ opacity: shown ? 1 : 0 }} transition={{ duration: 0.3 }}>
        <InfoStack
          index={index}
          count={products.length}
          name={product.name}
          colour={dye ? product.colourways?.[dye.to]?.label : way?.label}
          url={product.url}
          knob={knob}
          hasBack={!!view.back}
          onFace={face}
        />
      </motion.div>
    </div>
  );
});

export default FocusView;
