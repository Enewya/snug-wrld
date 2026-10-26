"use client";

import Image from "next/image";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { Product } from "@/lib/products";
import { photos, photoScale } from "@/lib/photo-catalog";
import type { RackOrigin } from "@/components/rack/Rack";
import { initMobileRack, type MobileRackApi } from "./mobile-rack-behaviour";
import "./mobile-rack-styles.css";

type Props = {
  products: Product[];
  /** Tap on the centred garment: open the focus view from its hanging point. */
  onSelect: (index: number, origin: RackOrigin) => void;
  /** Garment currently shown in the focus view (hidden here). */
  hiddenIndex?: number | null;
};

export type MobileRackHandle = MobileRackApi;

/** Rendered photo width as CSS: --umr-iw evens out by photoScale (same rule as components/Garment). */
const widthOf = (src: string) => `(var(--umr-iw) * ${photoScale[src] ?? 1})`;

/** Box that hangs a photo by its hook: the middle of the loop's inner gap sits on the rod's centre line. */
function box(src: string): React.CSSProperties {
  const m = photos[src];
  const gapMid = (m.loopInnerTopY + m.loopInnerBottomY) / 2;
  return {
    left: `calc(-1 * ${widthOf(src)} * ${m.loopCenterX / m.width})`,
    top: `calc(var(--rod) / 2 - ${widthOf(src)} * ${gapMid / m.width})`,
    width: `calc(${widthOf(src)})`,
    aspectRatio: `${m.width} / ${m.height}`,
  };
}

/** Side photo that faces right: mirrored about its hook loop, so the hook stays on the rod. */
function mirror(src: string): React.CSSProperties {
  const m = photos[src];
  return { transform: "scaleX(-1)", transformOrigin: `${((m.loopCenterX / m.width) * 100).toFixed(3)}% 0` };
}

/**
 * Compact-screen rack (< 600px): a static rod edge to edge under the header, the garments large
 * (about three across), dragged sideways 1:1 with momentum; the garment that comes to rest in the
 * centre turns from its side view to its front view. Behaviour: mobile-rack-behaviour.js.
 */
const MobileRack = forwardRef<MobileRackHandle, Props>(function MobileRack({ products, onSelect, hiddenIndex = null }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const api = useRef<MobileRackApi | null>(null);
  const select = useRef(onSelect);
  useEffect(() => { select.current = onSelect; }, [onSelect]);

  useEffect(() => {
    if (!root.current) return;
    const a = initMobileRack(root.current, { onSelect: (i, o) => select.current(i, o) });
    api.current = a;
    return () => { a.destroy(); api.current = null; };
  }, []);

  useImperativeHandle(ref, () => ({
    origin: (i) => api.current?.origin(i) ?? null,
    jumpTo: (i) => api.current?.jumpTo(i),
    resume: () => api.current?.resume(),
    destroy: () => {},
  }), []);

  return (
    <div ref={root} className="umr" role="group" aria-roledescription="carousel" aria-label="The rack: drag sideways, tap the centre piece to open it">
      {/* the rail: static, an end bracket 1.5vw in from each edge (as in the reel) */}
      <div className="umr__rail" aria-hidden="true">
        <div className="rail-tube" />
        <div className="rail-end l"><div className="rail-plate" /><div className="rail-cap" /></div>
        <div className="rail-end r"><div className="rail-plate" /><div className="rail-cap" /></div>
      </div>
      <ul className="umr__track" data-umr-track role="list">
        {products.map((p, i) => (
          <li key={p.slug} className="umr__item" data-umr-item
            style={{
              "--i": i,
              visibility: hiddenIndex === i ? "hidden" : undefined,
              // garment 0 starts centred and facing front, so its neighbours start pushed out
              transform: i === 0 ? undefined : "translate3d(var(--umr-push), 0, 0)",
            } as React.CSSProperties}>
            <div className="umr__garment">
              {/* the first garment starts in the centre, already showing its front (the state the
                  behaviour file starts in), so the first paint needs no JavaScript */}
              <div className="umr__card">
                <div className="umr__photo" data-umr-side style={{ ...box(p.side), opacity: i === 0 ? 0 : 1, ...(p.mirrorSide ? mirror(p.side) : {}) }}>
                  {/* same `sizes` as the desktop rack, so both share one cached file per photo */}
                  <Image src={p.side} width={photos[p.side].width} height={photos[p.side].height} sizes="36vh" alt=""
                    draggable={false} loading={i < 3 ? "eager" : "lazy"} />
                </div>
                <div className="umr__photo" data-umr-front style={{ ...box(p.front), opacity: i === 0 ? 1 : 0 }}>
                  <Image src={p.front} width={photos[p.front].width} height={photos[p.front].height} sizes="41vh" alt=""
                    draggable={false} loading={i < 2 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
                </div>
              </div>
            </div>
            <button type="button" className="umr__hit" data-umr-hit data-index={i} tabIndex={i === 0 ? 0 : -1}
              aria-label={p.name} aria-describedby="umr-hint" />
          </li>
        ))}
      </ul>
      <p className="umr__caption" data-umr-caption aria-live="polite">{products[0]?.name}</p>
      <p id="umr-hint" className="unk-sr">Tap the piece in the centre to open it. Use the left and right arrow keys to move along the rack.</p>
    </div>
  );
});

export default MobileRack;
