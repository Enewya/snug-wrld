// @ts-check
/**
 * Phone rack swipe hint: behaviour. Framework-free (the theme loads this same file). No libraries.
 * Every number comes from swipe-hint.data.ts (in the theme: section settings).
 *
 * Timeline (touch screens only, and not within 30 days of a successful swipe):
 *   t0   the hero is visible (60%) and settled (page loaded, 400ms still on screen): the row nudges
 *        24px left and springs back (600ms, M3 emphasized curves)
 *   +1.2s  "Swipe to explore" fades in (200ms) under the rack, chevrons pulsing
 *   label leaves (200ms) on the first drag, or after 6s
 *   untouched 8s more: one more nudge, label for 3s, then nothing more
 *   a successful swipe (the row comes to rest on another garment) stores a timestamp
 * Reduced motion: no nudge and no pulse; the label shows for 5s, once.
 */

/**
 * @param {HTMLElement} hint the `.ush` element (label + chevrons; aria-live polite)
 * @param {HTMLElement} hero element whose visibility starts the timeline (the phone rack)
 * @param {{ nudge: (px: number, outMs: number, backMs: number) => void }} rack
 * @param {Record<string, any>} cfg SWIPE_HINT
 * @returns {{ dragStart: () => void, swiped: () => void, destroy: () => void }}
 */
export function initSwipeHint(hint, hero, rack, cfg) {
  const none = { dragStart() {}, swiped() {}, destroy() {} };
  const text = /** @type {HTMLElement} */ (hint.querySelector("[data-ush-text]"));
  if (!window.matchMedia(cfg.media).matches || recent(cfg)) return none;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** @type {number[]} */
  const timers = [];
  const at = (/** @type {number} */ ms, /** @type {() => void} */ fn) => timers.push(window.setTimeout(fn, ms));
  const clear = () => { timers.forEach((t) => window.clearTimeout(t)); timers.length = 0; };
  let touched = false;
  let done = false;
  let started = false;

  const show = (/** @type {number} */ ms) => {
    text.textContent = cfg.label; // filled when shown, so the live region announces it
    hint.setAttribute("data-ush-on", "");
    at(ms, hide);
  };
  const hide = () => {
    hint.removeAttribute("data-ush-on");
    window.setTimeout(() => { if (!hint.hasAttribute("data-ush-on")) text.textContent = ""; }, cfg.fadeMs);
  };
  const nudge = () => { if (!reduced) rack.nudge(cfg.nudgePx, cfg.nudgeOutMs, cfg.nudgeBackMs); };

  function start() {
    if (started) return;
    started = true;
    if (reduced) { at(cfg.labelDelayMs, () => show(cfg.reducedLabelMs)); return; }
    nudge();
    at(cfg.labelDelayMs, () => {
      show(cfg.labelMs);
      // idle after the label has gone: one repeat, then stop
      at(cfg.labelMs + cfg.fadeMs + cfg.idleRepeatMs, () => {
        if (touched || done) return;
        nudge();
        show(cfg.repeatLabelMs);
      });
    });
  }

  // visible + settled: page loaded and the hero on screen for settleMs
  let settle = 0;
  const io = new IntersectionObserver(([e]) => {
    window.clearTimeout(settle);
    if (e.isIntersecting && e.intersectionRatio >= cfg.visibleRatio) {
      const go = () => { settle = window.setTimeout(start, cfg.settleMs); };
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    }
  }, { threshold: [0, cfg.visibleRatio, 1] });
  io.observe(hero);

  return {
    dragStart() {
      touched = true;
      clear();
      if (hint.hasAttribute("data-ush-on")) hide();
    },
    swiped() {
      done = true;
      try { localStorage.setItem(cfg.storageKey, String(Date.now())); } catch { /* storage blocked: fine */ }
    },
    destroy() { clear(); window.clearTimeout(settle); io.disconnect(); },
  };
}

/** @param {Record<string, any>} cfg */
function recent(cfg) {
  try {
    const t = Number(localStorage.getItem(cfg.storageKey));
    return t > 0 && Date.now() - t < cfg.quietDays * 864e5;
  } catch {
    return false;
  }
}
