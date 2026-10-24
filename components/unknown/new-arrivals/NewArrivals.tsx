/* Plain <img> on purpose: mirrors the Liquid section, where images come from Shopify's CDN. */
/* eslint-disable @next/next/no-img-element */

import { NEW_ARRIVALS, arrivals } from "./new-arrivals.data";
import "./new-arrivals.css";

/** New Arrivals: a 4-up grid (2-up on phones) fed by /collections/new-arrival in Shopify. */
export default function NewArrivals() {
  return (
    <section className="unk-arrivals" aria-labelledby="unk-arrivals-title">
      <div className="unk-wrap">
        <header className="unk-head">
          <div>
            <span className="unk-head__label">{NEW_ARRIVALS.label}</span>
            <h2 id="unk-arrivals-title" className="unk-head__title">{NEW_ARRIVALS.title}</h2>
          </div>
          <div className="unk-arrivals__actions">
            {NEW_ARRIVALS.placeholder && <span className="unk-flag">Placeholder data</span>}
            <a className="unk-link" href={NEW_ARRIVALS.collectionUrl}>View all <span aria-hidden="true">→</span></a>
          </div>
        </header>
        <ul className="unk-arrivals__grid" role="list">
          {arrivals.map((a, i) => (
            <li key={a.image} data-reveal style={{ "--reveal-step": i % 4 } as React.CSSProperties}>
              <a className="unk-card" href={a.url}>
                <span className="unk-card__well">
                  <img className="unk-card__img" src={a.image} alt={a.name} width={1086} height={1448} loading="lazy" decoding="async" />
                  <img className="unk-card__img unk-card__img--alt" src={a.hover} alt="" width={1086} height={1448} loading="lazy" decoding="async" />
                </span>
                <span className="unk-card__name">{a.name}</span>
                <span className="unk-card__price">{a.price ?? "Price on store"}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
