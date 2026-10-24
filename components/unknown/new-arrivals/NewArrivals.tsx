import Image from "next/image";
import UnkLink from "../link/UnkLink";
import { NEW_ARRIVALS, arrivals } from "./new-arrivals.data";
import "./new-arrivals.css";

/* sized to the card (in Liquid: image_url + widths + sizes); never the full-size photo */
const SIZES = "(max-width: 1023px) 50vw, min(25vw, 340px)";

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
          <UnkLink href={NEW_ARRIVALS.collectionUrl}>View all</UnkLink>
        </header>
        <ul className="unk-arrivals__grid" role="list">
          {arrivals.map((a, i) => (
            <li key={a.url} data-reveal style={{ "--reveal-step": i % 4 } as React.CSSProperties}>
              <a className="unk-card" href={a.url}>
                <span className="unk-card__well">
                  <Image className="unk-card__img" src={a.image} alt={a.name} fill sizes={SIZES} />
                  {a.hover && <Image className="unk-card__img unk-card__img--alt" src={a.hover} alt="" fill sizes={SIZES} />}
                </span>
                <span className="unk-card__name">{a.name}</span>
                <span className="unk-card__price">{a.price}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
