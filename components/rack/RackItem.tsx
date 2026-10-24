"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import Garment from "@/components/Garment";
import type { Product } from "@/lib/products";
import { useHangerSpring } from "@/lib/useHangerSpring";

export const HOVER_SCALE = 1.12;

type Props = {
  product: Product;
  index: number;
  count: number;
  hovered: boolean;
  /** Sideways shift, in photo widths, to make room for the hovered piece. */
  shift: number;
  zIndex: number;
  /** -1 / 1: which way the pointer was travelling when this piece was reached. */
  pushDir: React.RefObject<number>;
  /** Shown in the focus view instead. */
  hidden?: boolean;
};

/**
 * One hanger on the rack. The wrapper is a zero-size anchor where the loop rests on the rod's top
 * edge. It deliberately creates no stacking context, so its layers interleave with the rod:
 * hanger photo → rod (passes through the loop, hiding its middle and the tip) → contact line →
 * the loop's crest (clipped from the same photo) over the rod.
 */
export default function RackItem({ product, index, count, hovered, shift, zIndex, pushDir, hidden }: Props) {
  const reduce = useReducedMotion();

  // progress 0 = side photo facing us, 180 = front photo facing us. The photo turns 0→90 (squashing
  // to an edge), swaps to the front photo at the midpoint, then turns -90→0.
  const progress = useMotionValue(0);
  const swing = useMotionValue(0);
  const { springTo } = useHangerSpring(progress, swing, reduce);
  const turn = useTransform(progress, (p) => (p <= 90 ? p : p - 180));
  const sideOpacity = useTransform(progress, (p): number => (p <= 90 ? 1 : 0));
  const frontOpacity = useTransform(progress, (p): number => (p <= 90 ? 0 : 1));

  const scale = useSpring(1, { stiffness: 210, damping: 20 });
  const shiftMv = useSpring(0, { stiffness: 170, damping: 22 });
  const translate = useMotionTemplate`calc(var(--iw) * ${shiftMv}) 0`;

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // A passing hand pushes the hem the way it is moving; the turn itself adds the rest of the sway.
    const kick = -(pushDir.current ?? 1) * (hovered ? 26 : 16);
    springTo(hovered ? 180 : 0, { kick });
    if (reduce) scale.jump(hovered ? HOVER_SCALE : 1);
    else scale.set(hovered ? HOVER_SCALE : 1);
  }, [hovered, reduce, springTo, scale, pushDir]);

  useEffect(() => {
    if (reduce) shiftMv.jump(shift);
    else shiftMv.set(shift);
  }, [shift, reduce, shiftMv]);

  const layers = [
    { src: product.side, opacity: sideOpacity, sizes: "36vh", preload: true },
    { src: product.front, opacity: frontOpacity, sizes: "41vh" },
  ];

  return (
    <div
      className="rack-item"
      style={{ "--i": index - (count - 1) / 2, visibility: hidden ? "hidden" : undefined } as React.CSSProperties}
      role="img"
      aria-label={product.name}
    >
      <motion.div className="rack-layer rack-garment" style={{ translate, zIndex: 3 + zIndex } as MotionStyle}>
        <Garment turn={turn} swing={swing} bodyScale={scale} layers={layers} />
      </motion.div>
      <motion.div className="rack-layer" style={{ translate, zIndex: 205 } as MotionStyle}>
        <div className="hook-contact-line" />
      </motion.div>
      <motion.div className="rack-layer" style={{ translate, zIndex: 210 } as MotionStyle}>
        <Garment turn={turn} swing={swing} layers={layers} part="crest" />
      </motion.div>
    </div>
  );
}
