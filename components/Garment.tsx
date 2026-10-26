"use client";

import Image from "next/image";
import { motion, type MotionValue } from "framer-motion";
import type { Photo } from "@/lib/products";
import { photos, photoScale } from "@/lib/photo-catalog";

export type GarmentLayer = {
  src: string;
  /** 0/1: which photo is showing (e.g. side until the turn's midpoint, then front). */
  opacity: MotionValue<number>;
  sizes: string;
  preload?: boolean;
  /** Draw the photo mirrored about its hook loop (scaleX(-1)), so the hook stays exactly on the rod. */
  mirror?: boolean;
};

type Props = {
  layers: GarmentLayer[];
  /** rotateY in degrees around the hook (the photo squashes as it turns). */
  turn: MotionValue<number>;
  /** Pendulum rotateZ in degrees, pivoting where the loop rests on the rod. */
  swing: MotionValue<number>;
  /** Scale of the hanger + garment below the hook (hover). The hook itself never scales. */
  bodyScale?: MotionValue<number>;
  /**
   * "hanger": the whole photo (fixed-size hook above the neck, scalable body below it).
   * "crest":  only the part of the hook loop above the rod, drawn over the rod.
   */
  part?: "hanger" | "crest";
};

/** Rendered width of a photo, in CSS. --iw is set by the parent; photoScale evens out garment size;
 *  --garment-scale (default 1) lets a page size the garments without changing the rack's pitch. */
const widthOf = (src: string) => `(var(--iw) * var(--garment-scale, 1) * ${photoScale[src] ?? 1})`;
/** A y position in the photo (image px) → CSS length in the rendered photo. */
const yOf = (src: string, m: Photo, y: number) => `${widthOf(src)} * ${y / m.width}`;

/**
 * A hanger photo hung on the rod by its own hook. The element is a zero-size anchor at the pivot:
 * the rod's top edge, under the loop's crest. Each photo is placed so the rod's centre line runs
 * through the middle of its loop's inner gap, with the loop centred on the anchor, so the hook stays
 * put when photos swap. Swing / turn pivot at the anchor. Needs --iw and --rod (rod thickness).
 */
export default function Garment({ layers, turn, swing, bodyScale, part = "hanger" }: Props) {
  return (
    <motion.div className="garment" style={{ rotateZ: swing }}>
      <motion.div className="garment-card" style={{ rotateY: turn }}>
        {layers.map(({ src, opacity, sizes, preload, mirror }) => {
          const m = photos[src];
          const gapMid = (m.loopInnerTopY + m.loopInnerBottomY) / 2;
          const box = {
            left: `calc(-1 * ${widthOf(src)} * ${m.loopCenterX / m.width})`,
            top: `calc(var(--rod) / 2 - ${yOf(src, m, gapMid)})`,
            width: `calc(${widthOf(src)})`,
            aspectRatio: `${m.width} / ${m.height}`,
          };
          const img = (
            <Image
              src={src}
              width={m.width}
              height={m.height}
              sizes={sizes}
              alt=""
              preload={preload}
              loading={preload ? undefined : "eager"}
              draggable={false}
              style={mirror ? { transform: "scaleX(-1)", transformOrigin: `${((m.loopCenterX / m.width) * 100).toFixed(3)}% 0` } : undefined}
            />
          );
          if (part === "crest") {
            // keep only what sits above the rod's top edge
            const rodTopInPhoto = `calc(${yOf(src, m, gapMid)} - var(--rod) / 2)`;
            return (
              <motion.div key={src} className="garment-layer" style={{ ...box, opacity, clipPath: `inset(0 0 calc(100% - ${rodTopInPhoto}) 0)` }}>
                {img}
              </motion.div>
            );
          }
          const neck = `${((m.neckY / m.height) * 100).toFixed(3)}%`;
          return (
            <motion.div key={src} className="garment-layer" style={{ ...box, opacity }}>
              {/* hook: fixed size */}
              <div className="garment-piece" style={{ clipPath: `inset(0 0 calc(100% - ${neck}) 0)` }}>
                {img}
              </div>
              {/* hanger + garment: scales from the top of the neck, so it stays on the hook */}
              <motion.div
                className="garment-piece"
                style={{
                  clipPath: `inset(${neck} 0 0 0)`,
                  scale: bodyScale,
                  originX: m.loopCenterX / m.width,
                  originY: m.neckY / m.height,
                }}
              >
                {img}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
