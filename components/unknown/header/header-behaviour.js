// @ts-check
/**
 * UNKNOWN header: compact-screen dropdown menu. Framework-free (the theme loads this same file).
 *
 * - The hamburger toggles the panel (aria-expanded on the button; the panel is aria-controls).
 * - Open: the panel slides down and fades in (M3 emphasized-decelerate), the page behind dims
 *   (scrim), page scrolling is locked, focus moves into the panel and stays there (Tab / Shift+Tab
 *   wrap between the hamburger and the panel's links).
 * - Close: Esc, a tap outside (scrim), a link tap, or the hamburger again (M3 emphasized-
 *   accelerate). Focus returns to the hamburger (except after a link tap, which navigates).
 * - "Our Collections" expands in place (its own aria-expanded / aria-controls).
 * - Reduced motion: the CSS turns the slide into an instant change.
 *
 * Returns a cleanup function (theme: call it on shopify:section:unload).
 * @param {HTMLElement} root the header element
 */
export function initHeaderMenu(root) {
  const toggle = /** @type {HTMLButtonElement | null} */ (root.querySelector("[data-menu-toggle]"));
  const panel = /** @type {HTMLElement | null} */ (root.querySelector("[data-menu-panel]"));
  const scrim = /** @type {HTMLElement | null} */ (root.querySelector("[data-menu-scrim]"));
  if (!toggle || !panel || !scrim) return () => {};
  const html = document.documentElement;
  let open = false;

  const focusables = () =>
    /** @type {HTMLElement[]} */ ([toggle, ...panel.querySelectorAll("a[href], button")]).filter(
      (el) => el.offsetParent !== null || el === toggle,
    );

  /** @param {boolean} next @param {{ restoreFocus?: boolean }} [o] */
  function set(next, { restoreFocus = true } = {}) {
    if (next === open) return;
    open = next;
    toggle?.setAttribute("aria-expanded", String(open));
    toggle?.setAttribute("aria-label", open ? "Close menu" : "Menu");
    root.classList.toggle("is-menu-open", open);
    html.classList.toggle("unk-menu-open", open);
    if (open) {
      // first row gets focus once the panel is visible (visibility flips at the start of the transition)
      requestAnimationFrame(() => /** @type {HTMLElement | null} */ (panel?.querySelector("a[href], button"))?.focus({ preventScroll: true }));
    } else if (restoreFocus) {
      toggle?.focus({ preventScroll: true });
    }
  }

  const onToggle = () => set(!open);
  const onScrim = () => set(false);
  /** @param {KeyboardEvent} e */
  const onKey = (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      set(false);
      return;
    }
    if (e.key !== "Tab") return;
    // Tab order runs through the set only (hamburger, then the panel's rows), wrapping at both
    // ends; the wordmark and icons between them in the page stay out while the menu is open
    const list = focusables();
    const at = list.indexOf(/** @type {HTMLElement} */ (document.activeElement));
    e.preventDefault();
    const next = at === -1 ? (e.shiftKey ? list.length - 1 : 0) : (at + (e.shiftKey ? -1 : 1) + list.length) % list.length;
    list[next].focus();
  };
  /** @param {MouseEvent} e */
  const onPanelClick = (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    const group = /** @type {HTMLButtonElement | null} */ (target.closest("[data-menu-group]"));
    if (group) {
      const sub = document.getElementById(group.getAttribute("aria-controls") || "");
      const expanded = group.getAttribute("aria-expanded") === "true";
      group.setAttribute("aria-expanded", String(!expanded));
      if (sub) sub.hidden = expanded;
      return;
    }
    if (target.closest("a[href]")) set(false, { restoreFocus: false });
  };
  // the panel only exists on compact screens: close it if the window grows past them
  const wide = window.matchMedia("(min-width: 600px)");
  const onWide = () => wide.matches && set(false, { restoreFocus: false });

  toggle.addEventListener("click", onToggle);
  scrim.addEventListener("click", onScrim);
  panel.addEventListener("click", onPanelClick);
  document.addEventListener("keydown", onKey);
  wide.addEventListener("change", onWide);

  return () => {
    toggle.removeEventListener("click", onToggle);
    scrim.removeEventListener("click", onScrim);
    panel.removeEventListener("click", onPanelClick);
    document.removeEventListener("keydown", onKey);
    wide.removeEventListener("change", onWide);
    html.classList.remove("unk-menu-open");
  };
}
