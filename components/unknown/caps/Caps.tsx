/* Plain <img> on purpose: mirrors the Liquid section, where images come from Shopify's CDN. */
/* eslint-disable @next/next/no-img-element */

import { CAPS, caps, type CapItem } from "./caps.data";
import "./caps.css";

function Tile({ cap, big, step }: { cap: CapItem; big?: boolean; step: number }) {
  const body = (
    <>
      <span className="unk-caps__well">
        {cap.image ? (
          <img src={cap.image} alt={cap.name ?? ""} width={1200} height={1500} loading="lazy" decoding="async" />
        ) : (
          <span className="unk-caps__ph" aria-hidden="true">
            {/* simple line drawing of a cap: placeholder art only */}
            <svg viewBox="0 0 120 64" width={big ? 160 : 112} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 46c0-20 14-36 38-36s36 14 38 34" />
              <path d="M94 44c8 0 16 2 22 6-10 4-28 4-44 2" />
              <path d="M18 46c18 4 44 5 76-2" />
              <path d="M56 10v4" />
            </svg>
            <span className="unk-flag">Placeholder photo</span>
          </span>
        )}
      </span>
      <span className="unk-caps__name">{cap.name ?? "Product name — placeholder"}</span>
      <span className="unk-caps__price">{cap.price ?? "₦ — placeholder"}</span>
    </>
  );
  const cls = `unk-caps__tile${big ? " unk-caps__tile--big" : ""}`;
  const style = { "--reveal-step": step } as React.CSSProperties;
  return cap.url ? (
    <a className={cls} href={cap.url} data-reveal style={style}>{body}</a>
  ) : (
    <div className={cls} data-reveal style={style}>{body}</div>
  );
}

/** Caps / headwear: a shelf of one large and two small tiles, fed by the caps collection in Shopify. */
export default function Caps() {
  const [first, ...others] = caps;
  return (
    <section className="unk-caps" aria-labelledby="unk-caps-title">
      <div className="unk-wrap">
        <header className="unk-head">
          <div>
            <span className="unk-head__label">{CAPS.label}</span>
            <h2 id="unk-caps-title" className="unk-head__title">{CAPS.title}</h2>
            {CAPS.intro && <p className="unk-caps__intro">{CAPS.intro}</p>}
          </div>
          <div className="unk-caps__actions">
            {CAPS.placeholder && <span className="unk-flag">Placeholder data</span>}
            {CAPS.collectionUrl && <a className="unk-link" href={CAPS.collectionUrl}>Shop caps <span aria-hidden="true">→</span></a>}
          </div>
        </header>
        <div className="unk-caps__shelf">
          {first && <Tile cap={first} big step={0} />}
          <div className="unk-caps__side">
            {others.map((c, i) => <Tile key={i} cap={c} step={i + 1} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
