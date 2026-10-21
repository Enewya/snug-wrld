"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { colourFit, photos, photoScale } from "@/lib/products";
import { DIP_MS, dipPath, makeFingers } from "@/lib/dyeDip";

export type FocusViewSet = { side: string; front: string; back?: string };

const SIZES = "(max-width: 640px) 80vw, 50vh";

const hookY = (src: string) => (photos[src].loopInnerTopY + photos[src].loopInnerBottomY) / 2;
const shoulderC = (src: string) => (photos[src].shoulderX0 + photos[src].shoulderX1) / 2;

/**
 * Where a photo sits, in the reference photo's pixels, relative to that reference's top-left.
 * A plain photo is its own reference. A colourway photo is fitted onto the product's first
 * colourway (lib/products.ts colourFit): hook height, shoulder width and hem line all match.
 */
function placement(src: string) {
  const m = photos[src];
  const fit = colourFit[src];
  if (!fit) return { ref: src, x: 0, y: 0, w: m.width, h: m.height };
  return {
    ref: fit.ref,
    x: shoulderC(fit.ref) - shoulderC(src) * fit.sx,
    y: hookY(fit.ref) - hookY(src) * fit.sy,
    w: m.width * fit.sx,
    h: m.height * fit.sy,
  };
}

/** CSS box placing a photo so the middle of its (reference's) hook loop sits on the anchor. */
function boxFor(src: string) {
  const p = placement(src);
  const r = photos[p.ref];
  const W = `(var(--fiw) * ${photoScale[p.ref] ?? 1} / ${r.width})`; // CSS px per reference image px
  const left = p.x - r.loopCenterX;
  const top = p.y - hookY(p.ref);
  return {
    style: {
      left: `calc(${W} * ${left})`,
      top: `calc(${W} * ${top})`,
      width: `calc(${W} * ${p.w})`,
      height: `calc(${W} * ${p.h})`,
    },
    /** The hook axis (the anchor) as a fraction of the box width: the turning axis. */
    axisX: -left / p.w,
  };
}

/** How far below the hanging point a photo's hem sits, as a multiple of --fiw. */
export function hemOf(src: string) {
  const p = placement(src);
  const r = photos[p.ref];
  const sy = p.h / photos[src].height;
  return ((p.y + photos[src].garmentBottomY * sy - hookY(p.ref)) * (photoScale[p.ref] ?? 1)) / r.width;
}

const imgProps = (src: string) => {
  const m = photos[src];
  return getImageProps({ src, width: m.width, height: m.height, sizes: SIZES, alt: "" }).props;
};
const imgSrc = (src: string) => imgProps(src).src;

/** Loads a photo exactly as next/image renders it (same srcset + sizes, so the same file the face
 *  <img> uses) and resolves with the URL the browser picked. */
function loadLikeFace(src: string): Promise<string> {
  const p = imgProps(src);
  const i = new window.Image();
  if (p.sizes) i.sizes = p.sizes;
  if (p.srcSet) i.srcset = p.srcSet;
  i.src = p.src;
  return i.decode().catch(() => {}).then(() => i.currentSrc || p.src);
}

const sinOf = (a: number) => Math.sin((a * Math.PI) / 180);

/** One photo face: fixed-size hook above the walnut neck, scalable hanger + garment below, and the
 *  prototype's turning-edge shading masked to the photo. Faces hide their back side, so front and
 *  back swap exactly at 90°. */
function Face({
  src,
  opacity,
  turn,
  bodyScale,
  back,
  preload,
}: {
  src: string;
  opacity?: MotionValue<number>;
  turn: MotionValue<number>;
  bodyScale: MotionValue<number>;
  back?: boolean;
  preload?: boolean;
}) {
  const m = photos[src];
  const { style, axisX } = boxFor(src);
  const neck = `${((m.neckY / m.height) * 100).toFixed(3)}%`;
  const mask = `url(${imgSrc(src)})`;
  const shade = useTransform(turn, (a) => `linear-gradient(${sinOf(a) > 0 ? "to right" : "to left"},rgba(0,0,0,0) 15%,rgba(10,8,6,.75))`);
  const shadeOpacity = useTransform(turn, (a) => Math.min(1, Math.abs(sinOf(a)) * 1.1));
  const img = (
    <Image src={src} width={m.width} height={m.height} sizes={SIZES} alt="" preload={preload} loading="eager" draggable={false} />
  );
  return (
    <motion.div
      className="fg-layer fg-face"
      style={{
        ...style,
        opacity,
        // the back faces away: half a turn about the hook axis
        rotateY: back ? 180 : 0,
        originX: axisX,
      }}
    >
      <div className="fg-piece" style={{ clipPath: `inset(0 0 calc(100% - ${neck}) 0)` }}>
        {img}
      </div>
      <motion.div
        className="fg-piece"
        style={{ clipPath: `inset(${neck} 0 0 0)`, scale: bodyScale, originX: m.loopCenterX / m.width, originY: m.neckY / m.height }}
      >
        {img}
      </motion.div>
      <motion.div className="fg-shade" style={{ background: shade, opacity: shadeOpacity, WebkitMaskImage: mask, maskImage: mask }} />
    </motion.div>
  );
}

/**
 * Colour switch (prototype dye-dip): one wave mask drives both photos. Below the wave the new
 * colour shows, above it the old one; the old photo is masked with the exact inverse, so a pixel
 * never shows both. Both are drawn in the reference photo's frame, where colourways line up.
 */
function DyeDip({
  from,
  to,
  back,
  onStart,
  onDone,
}: {
  from: string;
  to: string;
  /** Dyeing the back photo: sits on the back face (half a turn about the hook). */
  back?: boolean;
  onStart: () => void;
  onDone: () => void;
}) {
  const ref = placement(to).ref;
  const r = photos[ref];
  const { style, axisX } = boxFor(ref);
  const id = useId().replace(/:/g, "");
  const reveal = useRef<SVGPathElement>(null);
  const hide = useRef<SVGPathElement>(null);
  const cb = useRef({ onStart, onDone });
  useEffect(() => {
    cb.current = { onStart, onDone };
  }, [onStart, onDone]);
  const [hrefs, setHrefs] = useState<{ from: string; to: string } | null>(null);

  // wait for both photos (the same files the faces show), so nothing ever flashes empty
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLikeFace(from), loadLikeFace(to)]).then(([a, b]) => {
      if (!cancelled) setHrefs({ from: a, to: b });
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    if (!hrefs) return;
    let raf = 0;
    const fingers = makeFingers(r.width);
    const set = (d: string) => {
      reveal.current?.setAttribute("d", d);
      hide.current?.setAttribute("d", d);
    };
    cb.current.onStart();
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DIP_MS);
      set(dipPath(t, now, r.width, r.height, fingers));
      if (t < 1) raf = requestAnimationFrame(tick);
      else cb.current.onDone();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hrefs, r.width, r.height]);

  if (!hrefs) return null;
  const place = (src: string) => {
    const p = placement(src);
    return { x: p.x, y: p.y, width: p.w, height: p.h };
  };
  const empty = `M0 ${r.height + 10}Z`;
  return (
    <div
      className="fg-layer fg-face"
      style={{ ...style, transform: back ? "rotateY(180deg)" : undefined, transformOrigin: `${axisX * 100}% 50%` }}
    >
      <svg className="fg-dye" viewBox={`0 0 ${r.width} ${r.height}`} aria-hidden="true">
        <defs>
          <mask id={`new-${id}`} maskUnits="userSpaceOnUse" x={-r.width} y={-r.height} width={r.width * 3} height={r.height * 3}>
            <path ref={reveal} fill="#fff" d={empty} />
          </mask>
          <mask id={`old-${id}`} maskUnits="userSpaceOnUse" x={-r.width} y={-r.height} width={r.width * 3} height={r.height * 3}>
            <rect x={-r.width} y={-r.height} width={r.width * 3} height={r.height * 3} fill="#fff" />
            <path ref={hide} fill="#000" d={empty} />
          </mask>
        </defs>
        <image href={hrefs.from} {...place(from)} preserveAspectRatio="none" mask={`url(#old-${id})`} />
        <image href={hrefs.to} {...place(to)} preserveAspectRatio="none" mask={`url(#new-${id})`} />
      </svg>
    </div>
  );
}

type Props = {
  view: FocusViewSet;
  /** Open/close: 0 = side photo facing us … 180 = front photo facing us (squash + swap at 90). */
  phase: MotionValue<number>;
  /** FRONT / BACK turn once open: 0 = front, 180 = back. */
  angle: MotionValue<number>;
  swing: MotionValue<number>;
  bodyScale: MotionValue<number>;
  /** A colour switch in progress on the face that is showing: from `from` to `to`. */
  dye?: { from: string; to: string; back: boolean; key: number } | null;
  onDyeDone?: () => void;
  /** Hint the compositor only while something moves; sharp, normally rastered layers otherwise. */
  moving?: boolean;
};

export default function FocusGarment({ view, phase, angle, swing, bodyScale, dye, onDyeDone, moving }: Props) {
  const turn = useTransform([phase, angle], ([p, a]: number[]) => (p <= 90 ? p : p - 180 + a));
  const sideOpacity = useTransform(phase, (p): number => (p <= 90 ? 1 : 0));
  const faceOpacity = useTransform(phase, (p): number => (p > 90 ? 1 : 0));
  const hidden = useTransform(phase, (): number => 0);
  // the current photo is hidden only once the dip has started drawing it (masked) itself
  const [started, setStarted] = useState<number | null>(null);
  const dipping = !!dye && started === dye.key;

  return (
    <motion.div className="fg" style={{ rotateZ: swing, willChange: moving ? "transform" : "auto" }}>
      <motion.div className="fg-card" style={{ rotateY: turn, willChange: moving ? "transform" : "auto" }}>
        <Face key={view.side} src={view.side} opacity={sideOpacity} turn={turn} bodyScale={bodyScale} />
        {/* while dyeing, the old and new photos of that face are drawn (masked by one wave) in the dye-dip */}
        <Face
          key={view.front}
          src={view.front}
          opacity={dipping && !dye.back ? hidden : faceOpacity}
          turn={turn}
          bodyScale={bodyScale}
          preload
        />
        {view.back && (
          <Face
            key={view.back}
            src={view.back}
            opacity={dipping && dye.back ? hidden : faceOpacity}
            turn={turn}
            bodyScale={bodyScale}
            back
          />
        )}
        {dye && onDyeDone && (
          <DyeDip key={dye.key} from={dye.from} to={dye.to} back={dye.back} onStart={() => setStarted(dye.key)} onDone={onDyeDone} />
        )}
      </motion.div>
    </motion.div>
  );
}
