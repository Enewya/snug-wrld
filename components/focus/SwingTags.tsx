"use client";

import type { Colourway } from "@/lib/products";
import { inkOn } from "@/lib/dyeDip";

/** Colourway swing tags dangling on strings beside the garment (ported from snug-rack-lab.html). */
export default function SwingTags({ ways, active, onPick }: { ways: Colourway[]; active: number; onPick: (i: number) => void }) {
  return (
    <div className="tags">
      {ways.map((c, i) => (
        <div key={c.label} className={`tagwrap${i === active ? " on" : ""}`} style={{ animationDelay: `${-i * 1.1}s` }}>
          <div className="string" style={{ height: `calc(var(--tag-string) + ${i} * var(--tag-step))` }} />
          {/* the button is the 48dp touch target; the tag shape inside is the visual */}
          <button
            type="button"
            className="tag-hit"
            aria-label={`Colour: ${c.label}`}
            aria-pressed={i === active}
            onClick={() => onPick(i)}
          >
            {/* outer shape = 1px ink outline at 20%; the coloured face is inset inside it */}
            <span className="tag" style={{ "--c": c.hex, "--fgc": inkOn(c.hex) } as React.CSSProperties} aria-hidden="true">
              <span className="tag-face">{c.label}</span>
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}
