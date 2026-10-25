import Image from "next/image";
import UnkLink from "../link/UnkLink";
import { CAPS, caps } from "./caps.data";
import "./caps-styles.css";

const SIZES = "(max-width: 839px) 50vw, min(25vw, 340px)";

/** Caps / headwear: the 4 real headwear products, a square shelf fed by /collections/headwear. */
export default function Caps() {
  return (
    <section className="unk-section unk-caps" aria-labelledby="unk-caps-title">
      <div className="unk-wrap">
        <header className="unk-head">
          <div>
            <span className="unk-head__label">{CAPS.label}</span>
            <h2 id="unk-caps-title" className="unk-head__title">{CAPS.title}</h2>
          </div>
          <UnkLink href={CAPS.collectionUrl}>View all</UnkLink>
        </header>
        <ul className="unk-caps__grid" role="list">
          {caps.map((c, i) => (
            <li key={c.url} data-reveal style={{ "--reveal-step": i } as React.CSSProperties}>
              <a className="unk-cap" href={c.url}>
                <span className="unk-cap__well">
                  <Image className="unk-cap__img" src={c.image} alt={c.name} fill sizes={SIZES} />
                  {c.hover && <Image className="unk-cap__img unk-cap__img--alt" src={c.hover} alt="" fill sizes={SIZES} />}
                </span>
                <span className="unk-cap__name">{c.name}</span>
                <span className="unk-cap__price">{c.price}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
