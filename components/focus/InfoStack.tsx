"use client";

import { motion, useMotionTemplate, useTransform, type MotionValue } from "framer-motion";

type Props = {
  index: number;
  count: number;
  name: string;
  colour?: string;
  url: string;
  /** 0 = front … 1 = back, follows the drag live. */
  knob: MotionValue<number>;
  hasBack: boolean;
  onFace: (back: boolean) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Info under the garment, in ANJAA's order and the prototype's sizes. */
export default function InfoStack({ index, count, name, colour, url, knob, hasBack, onFace }: Props) {
  const knobX = useMotionTemplate`${useTransform(knob, (t) => t * 100)}%`;
  const frontLit = useTransform(knob, (t) => (t < 0.5 ? "var(--paper)" : "var(--ink)"));
  const backLit = useTransform(knob, (t) => (t >= 0.5 ? "var(--paper)" : "var(--ink)"));
  return (
    <div className="info">
      <div className="info-hint">Drag to rotate</div>
      <div className="info-count">
        {pad(index + 1)} / {pad(count)}
      </div>
      <h2 className="info-name">{name}</h2>
      {colour && <div className="info-sub">{colour}</div>}
      <div className="seg" role="group" aria-label="View">
        <motion.span className="seg-knob" style={{ x: knobX }} />
        <motion.button type="button" style={{ color: frontLit }} onClick={() => onFace(false)}>
          FRONT
        </motion.button>
        <motion.button type="button" style={{ color: backLit }} onClick={() => onFace(true)} aria-disabled={!hasBack}>
          BACK
        </motion.button>
      </div>
      <a className="info-cta" href={url} target="_blank" rel="noopener">
        SEE AVAILABILITY ↗
      </a>
    </div>
  );
}
