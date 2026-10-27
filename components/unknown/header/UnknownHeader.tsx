"use client";

/* eslint-disable @next/next/no-img-element -- SVG wordmark, swapped by file */
import { useEffect, useRef } from "react";
import { UNKNOWN_LOGO } from "@/lib/unknown-brand";
import { Search02, ShoppingCart02, User02 } from "../icon-paths";
import Icon from "./Icon";
import { ABOUT, ICON_LINKS, NAV } from "./header.data";
import { initHeaderMenu } from "./header-behaviour";
import "./header-styles.css";
import { CurrencyMenuRow, CurrencyPicker } from "../currency/Currency";
import { initCurrency } from "../currency/currency-behaviour";
import { CURRENCY } from "../currency/currency.data";

type Props = {
  /** Shown instead of the icons while the focus view is open (its Close button). */
  close?: React.ReactNode;
  /** Focus view open: ABOUT and the wordmark fade out, as on Snug Wrld (bm-09). */
  focus?: boolean;
};

/**
 * Hero header. No solid bar. Expanded/medium: ABOUT left, wordmark centred, search / account /
 * cart right. Compact (< 600px): no left control (ABOUT moves into the menu); search, account,
 * cart and then the hamburger at the far right; the hamburger opens a dropdown panel with the
 * store navigation. The wordmark is centred where it fits beside four 48px targets (488px and
 * wider) and sits on the left margin below that (see header-styles.css and HANDOFF.md).
 * All menu behaviour lives in header-behaviour.js (plain JS, same file in the theme).
 */
export default function UnknownHeader({ close, focus = false }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? initHeaderMenu(ref.current) : undefined), []);
  // re-run when Close swaps in and out: the desktop picker leaves the DOM while the focus view is open
  const closing = !!close;
  useEffect(() => (ref.current ? initCurrency(ref.current, { storageKey: CURRENCY.storageKey, fallback: CURRENCY.default }) : undefined), [closing]);

  return (
    <header ref={ref} className={`unk-header${focus ? " unk-header--focus" : ""}`}>
      <div className="unk-header__start">
        <a className="unk-header__about unk-hit48" href={ABOUT.url} tabIndex={focus ? -1 : undefined}>{ABOUT.text}</a>
      </div>

      <a className="unknown-wordmark unk-header__logo" href="/unknown" aria-label="UNKNOWN home" tabIndex={focus ? -1 : undefined}>
        <img src={UNKNOWN_LOGO.src} width={UNKNOWN_LOGO.width} height={UNKNOWN_LOGO.height} alt={UNKNOWN_LOGO.alt} />
      </a>

      <div className="unk-header__end">
        {close ?? (
          <>
            <CurrencyPicker />
            <a className="unk-header__icon unk-state" href={ICON_LINKS.search.url} aria-label={ICON_LINKS.search.label}><Icon paths={Search02} /></a>
            <a className="unk-header__icon unk-state" href={ICON_LINKS.account.url} aria-label={ICON_LINKS.account.label}><Icon paths={User02} /></a>
            <a className="unk-header__icon unk-state" href={ICON_LINKS.cart.url} aria-label={ICON_LINKS.cart.label}><Icon paths={ShoppingCart02} /></a>
          </>
        )}
        {/* compact only, at the far right; always rendered (header-behaviour.js holds on to it),
            hidden while the focus view is open */}
        <button type="button" className="unk-header__icon unk-header__burger unk-state" data-menu-toggle
          aria-expanded="false" aria-controls="unk-menu" aria-label="Menu" hidden={!!close}>
          <span className="unk-burger" aria-hidden="true"><span /><span /></span>
        </button>
      </div>

      {/* compact menu: scrim + dropdown panel under the header */}
      <div className="unk-menu__scrim" data-menu-scrim aria-hidden="true" />
      <nav id="unk-menu" className="unk-menu" data-menu-panel aria-label="Main">
        <ul className="unk-menu__list" role="list">
          {NAV.map((item, i) => (
            <li key={item.text} className="unk-menu__item">
              {item.children ? (
                <>
                  <button type="button" className="unk-menu__row unk-menu__row--top unk-state" data-menu-group
                    aria-expanded="false" aria-controls={`unk-menu-sub-${i}`}>
                    {item.text}
                    <svg className="unk-menu__chev" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <ul id={`unk-menu-sub-${i}`} className="unk-menu__sub" role="list" hidden>
                    {item.children.map((c) => (
                      <li key={c.text}><a className="unk-menu__row unk-menu__row--child unk-state" href={c.url}>{c.text}</a></li>
                    ))}
                  </ul>
                </>
              ) : (
                <a className="unk-menu__row unk-menu__row--top unk-state" href={item.url}>{item.text}</a>
              )}
            </li>
          ))}
          <CurrencyMenuRow />
        </ul>
      </nav>
    </header>
  );
}
