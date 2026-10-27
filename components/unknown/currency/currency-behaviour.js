// @ts-check
/**
 * UNKNOWN currency selector: behaviour. Framework-free (the theme loads this same file). No libraries.
 *
 * Desktop (header, before search): a "NGN ▾" button opens a listbox popover.
 * - Opens on click / Enter / Space / Arrow Down; focus moves into the list (aria-activedescendant).
 * - Arrow Up / Down move, Home / End jump, a letter jumps to the next currency starting with it,
 *   Enter / Space / click choose; Esc, Tab, a click outside or a choice close it, and focus returns
 *   to the button.
 * - Motion: M3 emphasized decelerate in (400ms), emphasized accelerate out (200ms); CSS only.
 * Compact (menu panel): a "Currency  NGN" row expands an inline list (the menu's own accordion);
 * choosing a currency updates both and collapses the row.
 * The choice is kept in localStorage (try/catch). Rows are read from the DOM each time, so the
 * theme can print any list.
 *
 * SHOPIFY: the list is localization.available_countries (each country's currency.iso_code,
 * de-duplicated) and the current value localization.country.currency.iso_code. A choice must
 * submit Shopify's localization form so checkout really uses it:
 *   {% form 'localization', id: 'unk-localization' %}
 *     <input type="hidden" name="country_code" value="{{ localization.country.iso_code }}">
 *     <input type="hidden" name="return_to" value="{{ request.path }}">
 *   {% endform %}
 * POST /localization with country_code (currency follows the country's market); then the page
 * reloads in that market. In this prototype `onChoose` only stores the code.
 *
 * @param {HTMLElement} root element that contains the desktop picker and/or the menu row
 * @param {{ storageKey: string, fallback: string }} opts
 * @returns {() => void} cleanup
 */
export function initCurrency(root, { storageKey, fallback }) {
  const trigger = /** @type {HTMLButtonElement | null} */ (root.querySelector("[data-ucur-trigger]"));
  const list = /** @type {HTMLElement | null} */ (root.querySelector("[data-ucur-list]"));
  const accRow = /** @type {HTMLButtonElement | null} */ (root.querySelector("[data-ucur-acc]"));
  const accList = /** @type {HTMLElement | null} */ (root.querySelector("[data-ucur-acc-list]"));
  const codes = () => /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-ucur-code]")]);
  const options = () => /** @type {HTMLElement[]} */ (list ? [...list.querySelectorAll("[role=option]")] : []);
  const radios = () => /** @type {HTMLElement[]} */ (accList ? [...accList.querySelectorAll("[role=radio]")] : []);

  let current = fallback;
  try { current = localStorage.getItem(storageKey) || fallback; } catch { /* storage blocked */ }
  if (!options().some((o) => o.dataset.code === current) && !radios().some((o) => o.dataset.code === current)) current = fallback;

  function paint() {
    codes().forEach((c) => (c.textContent = current));
    trigger?.setAttribute("aria-label", `Currency: ${current}`);
    options().forEach((o) => o.setAttribute("aria-selected", String(o.dataset.code === current)));
    radios().forEach((o) => o.setAttribute("aria-checked", String(o.dataset.code === current)));
  }
  /** @param {string} code */
  function choose(code) {
    current = code;
    try { localStorage.setItem(storageKey, code); } catch { /* storage blocked: the choice lasts this page */ }
    paint();
    root.dispatchEvent(new CustomEvent("unk:currency", { detail: { code }, bubbles: true }));
  }

  // ---------- desktop popover ----------
  let active = -1;
  let typed = "";
  let typedAt = 0;
  const isOpen = () => trigger?.getAttribute("aria-expanded") === "true";
  /** @param {number} i */
  function activate(i) {
    const os = options();
    if (!os.length || !list) return;
    active = (i + os.length) % os.length;
    os.forEach((o, k) => o.toggleAttribute("data-active", k === active));
    list.setAttribute("aria-activedescendant", os[active].id);
    os[active].scrollIntoView({ block: "nearest" });
  }
  function open() {
    if (!trigger || !list) return;
    trigger.setAttribute("aria-expanded", "true");
    list.setAttribute("data-open", "");
    const os = options();
    activate(Math.max(0, os.findIndex((o) => o.dataset.code === current)));
    list.focus({ preventScroll: true });
    document.addEventListener("pointerdown", onOutside, true);
  }
  /** @param {boolean} [refocus] */
  function close(refocus = true) {
    if (!trigger || !list || !isOpen()) return;
    trigger.setAttribute("aria-expanded", "false");
    list.removeAttribute("data-open");
    list.removeAttribute("aria-activedescendant");
    document.removeEventListener("pointerdown", onOutside, true);
    if (refocus) trigger.focus({ preventScroll: true });
  }
  /** @param {PointerEvent} e */
  function onOutside(e) {
    const t = /** @type {Node} */ (e.target);
    if (!list?.contains(t) && !trigger?.contains(t)) close(false);
  }
  const onTrigger = () => (isOpen() ? close() : open());
  /** @param {KeyboardEvent} e */
  function onTriggerKey(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); if (e.key === "ArrowUp") activate(options().length - 1); }
  }
  /** @param {KeyboardEvent} e */
  function onListKey(e) {
    const os = options();
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); activate(active + 1); return;
      case "ArrowUp": e.preventDefault(); activate(active - 1); return;
      case "Home": e.preventDefault(); activate(0); return;
      case "End": e.preventDefault(); activate(os.length - 1); return;
      case "Enter": case " ": e.preventDefault(); if (os[active]) choose(os[active].dataset.code || fallback); close(); return;
      case "Escape": e.preventDefault(); close(); return;
      case "Tab": close(false); return;
    }
    // type-ahead: letters typed within 700ms build a prefix; one letter repeats cycle through matches
    if (e.key.length === 1 && /\S/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = performance.now();
      typed = now - typedAt > 700 ? e.key.toLowerCase() : typed + e.key.toLowerCase();
      typedAt = now;
      const label = (/** @type {HTMLElement} */ o) => `${o.dataset.name || ""}`.toLowerCase();
      const same = typed.split("").every((c) => c === typed[0]);
      const prefix = same ? typed[0] : typed;
      for (let k = 1; k <= os.length; k++) {
        const i = (active + (same || typed.length === 1 ? k : k - 1) + os.length) % os.length;
        if (label(os[i]).startsWith(prefix) || (os[i].dataset.code || "").toLowerCase().startsWith(prefix)) { activate(i); break; }
      }
    }
  }
  /** @param {MouseEvent} e */
  function onListClick(e) {
    const o = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[role=option]"));
    if (!o) return;
    choose(o.dataset.code || fallback);
    close();
  }
  /** @param {MouseEvent} e */
  function onListMove(e) {
    const o = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[role=option]"));
    if (o) activate(options().indexOf(o));
  }

  // ---------- compact menu row ----------
  /** @param {MouseEvent} e */
  function onRadio(e) {
    const o = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[role=radio]"));
    if (!o) return;
    choose(o.dataset.code || fallback);
    if (accRow && accList) { accRow.setAttribute("aria-expanded", "false"); accList.hidden = true; accRow.focus({ preventScroll: true }); }
  }
  /** @param {KeyboardEvent} e */
  function onRadioKey(e) {
    const rs = radios();
    const i = rs.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    if (i < 0) return;
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    rs[(i + d + rs.length) % rs.length].focus();
  }

  trigger?.addEventListener("click", onTrigger);
  trigger?.addEventListener("keydown", onTriggerKey);
  list?.addEventListener("keydown", onListKey);
  list?.addEventListener("click", onListClick);
  list?.addEventListener("pointermove", onListMove);
  accList?.addEventListener("click", onRadio);
  accList?.addEventListener("keydown", onRadioKey);
  paint();

  return () => {
    document.removeEventListener("pointerdown", onOutside, true);
    trigger?.removeEventListener("click", onTrigger);
    trigger?.removeEventListener("keydown", onTriggerKey);
    list?.removeEventListener("keydown", onListKey);
    list?.removeEventListener("click", onListClick);
    list?.removeEventListener("pointermove", onListMove);
    accList?.removeEventListener("click", onRadio);
    accList?.removeEventListener("keydown", onRadioKey);
  };
}
