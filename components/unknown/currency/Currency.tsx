import { CURRENCY } from "./currency.data";
import "./currency.css";

const Chevron = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Check = () => (
  <svg className="ucur__check" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Desktop: "NGN ▾" in the header's icon group (before search), its listbox popover, a hairline divider.
 *  Markup only; behaviour: currency-behaviour.js (initialised by the header). */
export function CurrencyPicker() {
  return (
    <div className="ucur">
      <button type="button" className="ucur__trigger unk-state" data-ucur-trigger aria-haspopup="listbox"
        aria-expanded="false" aria-controls="ucur-list" aria-label={`Currency: ${CURRENCY.default}`}>
        <span data-ucur-code suppressHydrationWarning>{CURRENCY.default}</span>
        <Chevron className="ucur__chev" />
      </button>
      <ul id="ucur-list" className="ucur__pop" role="listbox" aria-label={CURRENCY.label} tabIndex={-1} data-ucur-list>
        {CURRENCY.currencies.map((c) => (
          <li key={c.code} id={`ucur-opt-${c.code}`} role="option" className="ucur__opt" aria-selected={c.code === CURRENCY.default}
            data-code={c.code} data-name={c.name}>
            <Check />
            <span className="ucur__name">{c.name}</span>
            <span className="ucur__code">{c.code}</span>
          </li>
        ))}
      </ul>
      <span className="ucur__divider" aria-hidden="true" />
    </div>
  );
}

/** Compact: the last row of the menu panel, "Currency" left and the code right, expanding in place. */
export function CurrencyMenuRow() {
  return (
    <li className="unk-menu__item ucur-row">
      <button type="button" className="unk-menu__row unk-menu__row--top unk-state" data-menu-group data-ucur-acc
        aria-expanded="false" aria-controls="ucur-acc-list">
        <span>{CURRENCY.label}</span>
        <span className="ucur-row__end">
          <span className="ucur-row__code" data-ucur-code suppressHydrationWarning>{CURRENCY.default}</span>
          <Chevron className="unk-menu__chev" />
        </span>
      </button>
      <ul id="ucur-acc-list" className="unk-menu__sub" role="radiogroup" aria-label={CURRENCY.label} data-ucur-acc-list hidden>
        {CURRENCY.currencies.map((c) => (
          <li key={c.code}>
            <button type="button" role="radio" className="unk-menu__row unk-menu__row--child ucur-row__opt unk-state"
              aria-checked={c.code === CURRENCY.default} data-code={c.code}>
              <span>{c.name}</span>
              <span className="ucur-row__end">{c.code}<Check /></span>
            </button>
          </li>
        ))}
      </ul>
    </li>
  );
}
