"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Rail from "./Rail";
import RackItem from "./RackItem";
import { captionOf, products as defaultProducts, type Product } from "@/lib/products";
import { photos, photoScale } from "@/lib/photo-catalog";

/** Must match .rack in globals.css. All widths below are in rendered photo widths (--iw). */
const RAIL_Y = 0.272;
const PITCH = 0.33;
/** Push given to the nearest neighbours of the hovered piece, and how it fades further out (measured from bm-04/bm-07). */
const PUSH = 0.25;
const FALLOFF = 0.55;
/** While hovered, a piece keeps the pointer until it leaves its front-facing half-width. */
const HOLD = 0.45;

/**
 * Deepest hem on the rack below the rod's centre line, in photo widths (--iw): side photos at rest
 * and front photos hovered (hanger + garment scaled 1.12 from the walnut neck). The hover caption
 * sits at one fixed height under it, so it never jumps between garments.
 */
const HOVER_SCALE = 1.12; // must match RackItem
const deepestHem = (products: Product[]) => Math.max(
  ...products.flatMap((p) =>
    [p.side, p.front].map((src) => {
      const m = photos[src];
      const k = (photoScale[src] ?? 1) / m.width;
      const gapMid = (m.loopInnerTopY + m.loopInnerBottomY) / 2;
      const body = src === p.front ? HOVER_SCALE : 1;
      return ((m.neckY - gapMid) + (m.garmentBottomY - m.neckY) * body) * k;
    }),
  ),
);

function shiftFor(i: number, hovered: number | null) {
  if (hovered === null || i === hovered) return 0;
  const d = i - hovered;
  return Math.sign(d) * PUSH * Math.pow(FALLOFF, Math.abs(d) - 1);
}

/** Where a rack garment hangs, in viewport px: its anchor (rod top on its slot) and its sizes. */
export type RackOrigin = { x: number; y: number; iw: number; rod: number; hovered: boolean };

/** Reads the current on-screen anchor of rack garment `i` (for the focus view's fly in / out). */
export function rackOrigin(i: number, hovered = false): RackOrigin | null {
  const rack = document.querySelector<HTMLElement>(".rack");
  const item = rack?.querySelectorAll<HTMLElement>(".rack-item")[i];
  if (!rack || !item) return null;
  const r = item.getBoundingClientRect();
  const cs = getComputedStyle(rack);
  const rod = parseFloat(getComputedStyle(rack.querySelector<HTMLElement>(".rack-rail")!).height) || 0;
  return { x: r.left, y: r.top, iw: parseFloat(cs.getPropertyValue("--iw-px")) || 0, rod, hovered };
}

type Props = {
  products?: Product[];
  /** Click / tap on a garment. */
  onSelect?: (index: number, origin: RackOrigin) => void;
  /** Garment currently shown in the focus view (hidden here). */
  hiddenIndex?: number | null;
  /** Focus view open: no hover. */
  paused?: boolean;
};

export default function Rack({ products = defaultProducts, onSelect, hiddenIndex = null, paused = false }: Props) {
  const n = products.length;
  const c = (n - 1) / 2;
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const pushDir = useRef(1);

  const pick = useCallback(
    (x: number, y: number) => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const iw = parseFloat(getComputedStyle(el).getPropertyValue("--iw-px")) || 0;
      if (!iw) return null;
      const pitch = iw * PITCH;
      const railY = r.top + r.height * RAIL_Y;
      if (y < railY - 24 || y > railY + iw * 1.3) return null;
      const mid = r.left + r.width / 2;
      const slot = (i: number) => mid + (i - c) * pitch;
      const h = hoveredRef.current;
      if (h !== null && Math.abs(x - slot(h)) < iw * HOLD) return h;
      const i = Math.max(0, Math.min(n - 1, Math.round((x - mid) / pitch + c)));
      const reach = pitch / 2 + (i === 0 || i === n - 1 ? iw * 0.05 : 0);
      return Math.abs(x - slot(i)) < reach ? i : null;
    },
    [c, n],
  );

  const set = useCallback((i: number | null) => {
    if (i === hoveredRef.current) return;
    if (hoveredRef.current !== null) setLast(hoveredRef.current);
    hoveredRef.current = i;
    setHovered(i);
  }, []);

  useEffect(() => {
    if (paused) set(null);
  }, [paused, set]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || paused) return;
    if (e.movementX) pushDir.current = Math.sign(e.movementX);
    set(pick(e.clientX, e.clientY));
  };

  return (
    <div
      ref={ref}
      className="rack"
      style={{ cursor: hovered === null ? "default" : "pointer" }}
      onPointerMove={onMove}
      onPointerLeave={() => set(null)}
      onClick={(e) => {
        if (paused || !onSelect) return;
        const i = pick(e.clientX, e.clientY);
        const o = i === null ? null : rackOrigin(i, hoveredRef.current === i);
        if (i !== null && o) onSelect(i, o);
      }}
    >
      <Rail className="rack-rail" />
      {products.map((product, i) => (
        <RackItem
          key={product.slug}
          product={product}
          index={i}
          count={n}
          hovered={hovered === i}
          shift={shiftFor(i, hovered)}
          zIndex={hovered === i ? 100 : last === i ? 50 : i + 1}
          pushDir={pushDir}
          hidden={hiddenIndex === i}
        />
      ))}
      {/* "Name — Colour" under the hovered garment (bm-03…08): fixed height, no swing, no mobile */}
      {products.map((product, i) => (
        <p
          key={product.slug}
          className="rack-caption"
          style={{ "--i": i - c, "--hem": deepestHem(products), opacity: hovered === i ? 1 : 0 } as React.CSSProperties}
          aria-hidden={hovered !== i}
        >
          {captionOf(product)}
        </p>
      ))}
    </div>
  );
}
