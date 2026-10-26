/* eslint-disable @next/next/no-img-element -- SVG wordmark, swapped by file */
import { UNKNOWN_LOGO, UNKNOWN_STORE } from "@/lib/unknown-brand";
import { FOOTER_COLUMNS } from "./footer.data";
import "./footer-styles.css";

/** Footer on the warm-grey wall, bookending the hero. */
export default function Footer() {
  return (
    <footer className="unk-section unk-footer">
      <div className="unk-wrap unk-footer__grid">
        <div className="unk-footer__brand">
          {/* address and opening hours removed: the Visit section right above shows both */}
          <img src={UNKNOWN_LOGO.src} width={UNKNOWN_LOGO.width} height={UNKNOWN_LOGO.height} alt={UNKNOWN_LOGO.alt} loading="lazy" />
        </div>
        {/* the link columns sit side by side, as one group on the right edge of the content */}
        <div className="unk-footer__links">
          {FOOTER_COLUMNS.map((c) => (
            <nav key={c.title} className="unk-footer__col" aria-label={c.title}>
              <h2 className="unk-footer__title">{c.title}</h2>
              <ul role="list">
                {c.links.map((l) => <li key={l.text}><a href={l.url}>{l.text}</a></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="unk-wrap unk-footer__base">
        <span>© 2026 {UNKNOWN_STORE.name}, {UNKNOWN_STORE.city}</span>
        <a href={UNKNOWN_STORE.site}>unk-nown.com</a>
      </div>
    </footer>
  );
}
