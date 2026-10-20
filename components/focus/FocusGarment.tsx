"use client";

import { useEffect, useId, useRef } from "react";
import Image, { getImageProps } from "next/image";
import { motion, useTransform, type MotionValue } from "framer-motion";
import { photos, photoScale } from "@/lib/products";
import { DIP_MS, dipPath, makeFingers } from "@/lib/dyeDip";

export type FocusViewSet = { side: string; front: string; back?: string };

const SIZES = "(max-width: 640px) 80vw, 50vh";

/** Rendered width of a photo in the focus view (--fiw set by the parent; photoScale evens garment size). */
const widthOf = (src: string) => `(var(--fiw) * ${photoScale[src] ?? 1})`;

/** Box placing a photo so the middle of its hook loop sits on the anchor (the hanging point). */
function boxFor(src: string) {
  const m = photos[src];
  const gapMid = (m.loopInnerTopY + m.loopInnerBottomY) / 2;
  return {
    left: `calc(-1 * ${widthOf(src)} * ${m.loopCenterX / m.width})`,
    top: `calc(-1 * ${widthOf(src)} * ${gapMid / m.width})`,
    width: `calc(${widthOf(src)})`,
    aspectRatio: `${m.width} / ${m.height}`,
  };
}

const maskUrl = (src: string) => {
  const m = photos[src];
  return `url(${getImageProps({ src, width: m.width, height: m.height, sizes: SIZES, alt: "" }).props.src})`;
};

const sinOf = (a: number) => Math.sin((a * Math.PI) / 180);

/** One photo: fixed-size hook above the walnut neck, scalable hanger + garment below, and the
 *  prototype's turning-edge shading masked to the photo. */
function Photo({
  src,
  opacity,
  turn,
  bodyScale,
  mirrored,
  preload,
}: {
  src: string;
  opacity: MotionValue<number>;
  turn: MotionValue<number>;
  bodyScale: MotionValue<number>;
  mirrored?: boolean;
  preload?: boolean;
}) {
  const m = photos[src];
  const neck = `${((m.neckY / m.height) * 100).toFixed(3)}%`;
  const mask = maskUrl(src);
  // prototype shading: darkens the edge turning away, stronger the further it turns
  const shade = useTransform(turn, (a) => `linear-gradient(${sinOf(a) > 0 ? "to right" : "to left"},rgba(0,0,0,0) 15%,rgba(10,8,6,.75))`);
  const shadeOpacity = useTransform(turn, (a) => Math.min(1, Math.abs(sinOf(a)) * 1.1));
  const img = (
    <Image src={src} width={m.width} height={m.height} sizes={SIZES} alt="" preload={preload} loading="eager" draggable={false} />
  );
  return (
    <motion.div
      className="fg-layer"
      style={{
        ...boxFor(src),
        opacity,
        // the back photo is seen through a half turn: mirror it about the hook so it reads correctly
        scaleX: mirrored ? -1 : 1,
        originX: m.loopCenterX / m.width,
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

/** The new colourway rising from the hem (prototype dye-dip), drawn in the new photo's own box. */
function DyeDip({ src, onDone }: { src: string; onDone: () => void }) {
  const m = photos[src];
  const id = useId().replace(/:/g, "");
  const path = useRef<SVGPathElement>(null);
  const href = getImageProps({ src, width: m.width, height: m.height, sizes: SIZES, alt: "" }).props.src;
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const fingers = makeFingers(m.width);
    // wait for the photo so the dye never reveals an empty image
    const pre = new window.Image();
    pre.src = href;
    pre.decode().catch(() => {}).then(() => {
      if (cancelled) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - t0) / DIP_MS);
        path.current?.setAttribute("d", dipPath(t, now, m.width, m.height, fingers));
        if (t < 1) raf = requestAnimationFrame(tick);
        else done.current();
      };
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [href, m.width, m.height]);

  return (
    <div className="fg-layer" style={boxFor(src)}>
      <svg className="fg-dye" viewBox={`0 0 ${m.width} ${m.height}`} aria-hidden="true">
        <defs>
          <mask id={`dip-${id}`}>
            <path ref={path} fill="#fff" d={`M0 ${m.height + 10}Z`} />
          </mask>
        </defs>
        <image href={href} width={m.width} height={m.height} mask={`url(#dip-${id})`} />
      </svg>
    </div>
  );
}

type Props = {
  view: FocusViewSet;
  /** Open/close: 0 = side photo facing us … 180 = front photo facing us (squash + swap at 90). */
  phase: MotionValue<number>;
  /** Drag turn once open: 0 = front, ±180 = back (prototype angle). */
  angle: MotionValue<number>;
  swing: MotionValue<number>;
  bodyScale: MotionValue<number>;
  dye?: { src: string; key: number } | null;
  onDyeDone?: () => void;
};

export default function FocusGarment({ view, phase, angle, swing, bodyScale, dye, onDyeDone }: Props) {
  const turn = useTransform([phase, angle], ([p, a]: number[]) => (p <= 90 ? p : p - 180 + a));
  const isBack = (a: number) => {
    const n = ((a % 360) + 360) % 360;
    return n > 90 && n < 270;
  };
  const hasBack = !!view.back;
  const sideOpacity = useTransform(phase, (p): number => (p <= 90 ? 1 : 0));
  const frontOpacity = useTransform([phase, angle], ([p, a]: number[]): number => (p > 90 && (!hasBack || !isBack(a)) ? 1 : 0));
  const backOpacity = useTransform([phase, angle], ([p, a]: number[]): number => (p > 90 && hasBack && isBack(a) ? 1 : 0));

  return (
    <motion.div className="fg" style={{ rotateZ: swing }}>
      <motion.div className="fg-card" style={{ rotateY: turn }}>
        <Photo key={view.side} src={view.side} opacity={sideOpacity} turn={turn} bodyScale={bodyScale} />
        <Photo key={view.front} src={view.front} opacity={frontOpacity} turn={turn} bodyScale={bodyScale} preload />
        {view.back && <Photo key={view.back} src={view.back} opacity={backOpacity} turn={turn} bodyScale={bodyScale} mirrored />}
        {dye && onDyeDone && <DyeDip key={dye.key} src={dye.src} onDone={onDyeDone} />}
      </motion.div>
    </motion.div>
  );
}
