"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import Rail from "@/components/rack/Rail";
import RackItem from "@/components/rack/RackItem";
import { rackOrigin, type RackOrigin } from "@/components/rack/Rack";
import { captionOf, type Product } from "@/lib/products";
import { photos, photoScale } from "@/lib/photo-catalog";
import { initDesktopRack, type DesktopRackApi } from "./desktop-rack-behaviour";
import "./desktop-rack.css";

/** Must match .rack in globals.css. */
const RAIL_Y = 0.272;
/** Same hover feel as the shared rack (components/rack/Rack.tsx): push, falloff, hold, hover scale. */
const PUSH = 0.25;
const FALLOFF = 0.55;
const HOLD = 0.45;
const HOVER_SCALE = 1.12;

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

/** How far a garment's side photo reaches past its hook to the right / left, as a share of the photo width. */
const reachOf = (p: Product | undefined, side: "l" | "r") => {
  if (!p) return 0;
  const m = photos[p.side];
  const right = (m.garmentX1 - m.loopCenterX) / m.width;
  const left = (m.loopCenterX - m.garmentX0) / m.width;
  return (side === "r") !== !!p.mirrorSide ? right : left;
};

function shiftFor(i: number, hovered: number | null) {
  if (hovered === null || i === hovered) return 0;
  const d = i - hovered;
  return Math.sign(d) * PUSH * Math.pow(FALLOFF, Math.abs(d) - 1);
}

type Props = {
  products: Product[];
  onSelect?: (index: number, origin: RackOrigin) => void;
  hiddenIndex?: number | null;
  paused?: boolean;
};

export type DesktopRackHandle = { reveal: (i: number) => void };

/**
 * UNKNOWN desktop rack (600px and up). Same garments, hover turn and click-to-open as the shared
 * rack, but laid out from the left bracket and scrollable: the first garment starts one margin step
 * inside the left bracket, the row runs on past the right bracket (clipped there), and drag,
 * trackpad and arrow keys move it (desktop-rack-behaviour.js). Geometry: desktop-rack.css.
 */
const DesktopRack = forwardRef<DesktopRackHandle, Props>(function DesktopRack({ products, onSelect, hiddenIndex = null, paused = false }, ref) {
  const n = products.length;
  const c = (n - 1) / 2;
  const root = useRef<HTMLDivElement>(null);
  const api = useRef<DesktopRackApi | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const pushDir = useRef(1);

  const set = useCallback((i: number | null) => {
    if (i === hoveredRef.current) return;
    if (hoveredRef.current !== null) setLast(hoveredRef.current);
    hoveredRef.current = i;
    setHovered(i);
  }, []);

  useEffect(() => {
    if (!root.current) return;
    const a = initDesktopRack(root.current, { onMove: () => set(null) });
    api.current = a;
    return () => { a.destroy(); api.current = null; };
  }, [set]);

  useImperativeHandle(ref, () => ({ reveal: (i) => api.current?.reveal(i) }), []);

  useEffect(() => {
    if (paused) set(null);
  }, [paused, set]);

  /** Garment under the pointer: slots are read from the anchors (they carry the scroll offset). */
  const pick = useCallback((x: number, y: number) => {
    const el = root.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const iw = parseFloat(getComputedStyle(el).getPropertyValue("--iw-px")) || 0;
    if (!iw) return null;
    const railY = r.top + r.height * RAIL_Y;
    if (y < railY - 24 || y > railY + iw * 1.3) return null;
    const l = el.querySelector(".udr__rail .rail-end.l")?.getBoundingClientRect().right ?? r.left;
    const rr = el.querySelector(".udr__rail .rail-end.r")?.getBoundingClientRect().left ?? r.right;
    const scrolled = el.hasAttribute("data-udr-scrolled");
    const more = el.hasAttribute("data-udr-more");
    // past a bracket nothing is visible (clipped) unless the row is at that end
    if ((scrolled && x < l) || (more && x > rr)) return null;
    const anchors = [...el.querySelectorAll<HTMLElement>(".rack-item")].map((it) => it.getBoundingClientRect().left);
    const pitch = anchors.length > 1 ? anchors[1] - anchors[0] : iw;
    const h = hoveredRef.current;
    if (h !== null && Math.abs(x - anchors[h]) < iw * HOLD) return h;
    const i = Math.max(0, Math.min(n - 1, Math.round((x - anchors[0]) / pitch)));
    const reach = pitch / 2 + (i === 0 || i === n - 1 ? iw * 0.05 : 0);
    return Math.abs(x - anchors[i]) < reach ? i : null;
  }, [n]);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || paused || api.current?.isDragging()) return;
    if (e.movementX) pushDir.current = Math.sign(e.movementX);
    set(pick(e.clientX, e.clientY));
  };

  return (
    <div
      ref={root}
      className="rack udr"
      data-reach={reachOf(products[n - 1], "r").toFixed(4)}
      data-udr-more=""
      style={{ "--udr-c": c, "--udr-first-reach": reachOf(products[0], "l").toFixed(4), cursor: hovered === null ? "default" : "pointer" } as React.CSSProperties}
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="The rack. Drag sideways or use the left and right arrow keys to move along it."
      onPointerMove={onMove}
      onPointerLeave={() => set(null)}
      onClick={(e) => {
        if (paused || !onSelect || api.current?.justDragged()) return;
        const i = pick(e.clientX, e.clientY);
        const o = i === null ? null : rackOrigin(i, hoveredRef.current === i);
        if (i !== null && o) onSelect(i, o);
      }}
    >
      {/* brackets (static, outside the clip); the tube itself is drawn inside the clip so the hook
          loops can pass over and behind it */}
      <Rail className="rack-rail udr__rail" />
      <div className="udr__clip" data-udr-clip>
        <Rail className="rack-rail udr__tube" />
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
    </div>
  );
});

export default DesktopRack;
