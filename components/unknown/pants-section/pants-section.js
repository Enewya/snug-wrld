// @ts-check
/**
 * UNKNOWN pants section: behaviour. Framework-free on purpose: the Shopify theme loads this same
 * file from the section (see HANDOFF.md). No libraries; animations use the browser's built-in
 * Web Animations API (element.animate).
 *
 * How it works:
 * - The section is N screens tall and its stage is `position: sticky`, so the stage stays pinned
 *   while the page scrolls through the section (pure CSS, no JS needed for the pinning).
 * - On scroll, the share of the section scrolled so far picks the active pair (equal steps).
 * - When the active pair changes, one timed swap plays (it is triggered by scroll, not scrubbed):
 *     1. the outgoing pants fade out and drop a little while the model in neutral pants fades in
 *        under them (the base is only shown during a swap, so its arms never show at rest);
 *     2. the faint grey "peek" at the right edge becomes the incoming pair: it glides onto the
 *        model while still ghosted (so old and new overlap briefly) and only turns solid as it
 *        lands; the next peek then fades in at the edge;
 *     3. the product name rolls up word by word (old out, new in), price and buy bar cross-fade.
 *   Going back plays the same in reverse. Every animation starts from wherever the element is
 *   right now, so fast scrolling never makes anything jump.
 * - prefers-reduced-motion: pants, text and bar simply cross-fade, nothing slides.
 */

const EASE_OUT = "cubic-bezier(.22,.61,.36,1)";
const EASE_IN = "cubic-bezier(.6,0,.8,.3)";
const EASE_LEAVE = "cubic-bezier(.4,0,1,1)";

/** Timings (ms) and distances. Slow on purpose: smooth and unhurried. */
const T = {
  leave: 440, // outgoing pants: fade + drop
  drop: 16, // px the outgoing pants drop
  enter: 860, // incoming pants: glide in from the peek
  enterDelay: 120,
  peekIn: 640,
  peekDelay: 620,
  wordsOut: 380,
  wordsIn: 680,
  wordsInDelay: 260,
  stagger: 45,
  fade: 320,
  baseOut: 300, // base model fades away under the new pair once it has landed
  reduced: 450, // cross-fade length with reduced motion
};

/** @typedef {Record<string, string>} Styles */

/**
 * Animate `el` to the `to` styles, starting from its current on-screen state (or from `from`).
 * Leaves the final styles on the element, so it stays put when the animation ends.
 * @param {HTMLElement} el
 * @param {Styles} to
 * @param {KeyframeAnimationOptions} opts
 * @param {Styles} [from]
 */
function run(el, to, opts, from) {
  const cs = getComputedStyle(el);
  /** @type {Styles} */
  const start = {};
  for (const k in to) start[k] = from?.[k] ?? cs.getPropertyValue(k);
  stop(el, to);
  Object.assign(el.style, to);
  el.animate([start, to], { fill: "backwards", ...opts });
}

/** Jump straight to `to` (no animation). @param {HTMLElement} el @param {Styles} to */
function set(el, to) {
  stop(el, to);
  Object.assign(el.style, to);
}

/** Cancel running animations on `el` that touch any of the given properties. @param {HTMLElement} el @param {Styles} props */
function stop(el, props) {
  for (const a of el.getAnimations()) {
    const frames = a.effect instanceof KeyframeEffect ? a.effect.getKeyframes() : [];
    if (frames.some((f) => Object.keys(props).some((k) => k in f))) a.cancel();
  }
}

const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");

/**
 * Wire up one pants section. Returns a cleanup function (call it when the section is removed,
 * e.g. on Shopify's `shopify:section:unload`).
 * @param {HTMLElement} root the `.unk-pants` section element
 */
export function initPantsSection(root) {
  const q = (/** @type {string} */ s) => /** @type {HTMLElement} */ (root.querySelector(s));
  const qa = (/** @type {string} */ s, el = root) => /** @type {HTMLElement[]} */ ([...el.querySelectorAll(s)]);

  const stage = q("[data-pants-stage]");
  const figure = q("[data-pants-figure]");
  const base = q("[data-pants-base]");
  const peekBox = q("[data-pants-peek-box]");
  const layers = qa("[data-pants-layer]");
  const peeks = qa("[data-pants-peek]");
  const items = qa("[data-pants-item]");
  const counter = q("[data-pants-current]");
  const progress = q("[data-pants-progress]");
  const status = q("[data-pants-status]");
  const prev = q("[data-pants-prev]");
  const next = q("[data-pants-next]");
  const n = items.length;
  if (!n || !stage) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const peekOpacity = () => parseFloat(getComputedStyle(root).getPropertyValue("--peek-opacity")) || 0.2;
  let index = -1;
  let raf = 0;
  /** @type {number[]} */
  const timers = [];

  /** Scroll progress through the section (0–1) and the pair it selects. */
  function measure() {
    const travel = root.offsetHeight - stage.offsetHeight;
    const p = travel > 0 ? Math.min(1, Math.max(0, -root.getBoundingClientRect().top / travel)) : 0;
    return { p, i: Math.min(n - 1, Math.floor(p * n)) };
  }

  /** Where the peek sits, as a transform for a figure layer (layers scale from their top-left). */
  function ghostTransform(dir = 1) {
    const f = figure.getBoundingClientRect();
    const pk = peekBox.getBoundingClientRect();
    const s = pk.height / f.height || 1;
    const dx = dir > 0 ? pk.left - f.left : -(pk.left - f.left) * 0.5;
    return `translate(${dx}px, ${pk.top - f.top}px) scale(${s})`;
  }

  const rolls = (/** @type {number} */ i) => qa("[data-pants-roll]", items[i]);
  const fades = (/** @type {number} */ i) => qa("[data-pants-fade]", items[i]);
  const buy = (/** @type {number} */ i) => qa("[data-pants-buy]", items[i])[0];

  /** Accessibility + arrow state for the active pair. @param {number} to */
  function mark(to) {
    items.forEach((el, i) => {
      const on = i === to;
      el.classList.toggle("is-active", on);
      el.toggleAttribute("inert", !on);
      el.setAttribute("aria-hidden", String(!on));
    });
    prev.setAttribute("aria-disabled", String(to === 0));
    next.setAttribute("aria-disabled", String(to === n - 1));
  }

  /** Show pair `to` with no animation (first paint, or after a resize). @param {number} to */
  function settle(to) {
    set(base, { opacity: "0" });
    layers.forEach((el, i) => set(el, { opacity: i === to ? "1" : "0", transform: "none", filter: "none" }));
    peeks.forEach((el, i) => set(el, { opacity: i === to + 1 ? String(peekOpacity()) : "0", transform: "none" }));
    items.forEach((el, i) => {
      el.classList.remove("is-leaving");
      set(el, { opacity: "1" });
      [...rolls(i), ...fades(i), buy(i)].forEach((c) => set(c, { opacity: "1", transform: "none" }));
    });
    counter.textContent = pad(to + 1);
  }

  /** @param {number} to @param {number} from @param {number} dir */
  function swap(to, from, dir) {
    // pants: any layer that is neither leaving nor arriving fades out quickly (fast scrolling)
    layers.forEach((el, i) => {
      if (i !== to && i !== from) run(el, { opacity: "0", transform: "none", filter: "none" }, { duration: 200 });
    });
    run(layers[from], { opacity: "0", transform: `translateY(${T.drop}px)`, filter: "none" }, { duration: T.leave, easing: EASE_LEAVE });
    // the base fades in as the old pair leaves and out once the new one has landed
    const total = T.enterDelay + T.enter + T.baseOut;
    const baseFrom = getComputedStyle(base).opacity;
    set(base, { opacity: "0" });
    base.animate([
      { opacity: baseFrom },
      { opacity: 1, offset: T.leave / total },
      { opacity: 1, offset: (T.enterDelay + T.enter) / total },
      { opacity: 0 },
    ], { duration: total });
    const incoming = layers[to];
    const offStage = parseFloat(getComputedStyle(incoming).opacity) < 0.05;
    const ghost = offStage ? { transform: ghostTransform(dir), opacity: String(peekOpacity()), filter: "grayscale(1)" } : undefined;
    // movement eases out (fast, then settles); solidity eases in (stays ghosted until it lands)
    run(incoming, { transform: "none" }, { duration: T.enter, delay: T.enterDelay, easing: EASE_OUT }, ghost);
    run(incoming, { opacity: "1", filter: "grayscale(0)" }, { duration: T.enter, delay: T.enterDelay, easing: EASE_IN }, ghost);

    // peek: the incoming pair leaves the edge at once (its ghost took over); the next one fades in
    peeks.forEach((el, i) => {
      if (i === to) set(el, { opacity: "0", transform: "none" });
      else if (i === to + 1) {
        const hidden = parseFloat(getComputedStyle(el).opacity) < 0.05;
        run(el, { opacity: String(peekOpacity()), transform: "none" }, { duration: T.peekIn, delay: T.peekDelay, easing: EASE_OUT },
          hidden ? { opacity: "0", transform: "translateX(48px)" } : undefined);
      } else run(el, { opacity: "0", transform: "none" }, { duration: 200 });
    });

    // text: words roll out (up when going forward) and the new ones roll in after them
    const out = dir > 0 ? "-110%" : "110%";
    const into = dir > 0 ? "110%" : "-110%";
    items.forEach((el, i) => {
      set(el, { opacity: "1" });
      if (i !== to && i !== from) el.classList.remove("is-leaving");
    });
    const leaving = items[from];
    leaving.classList.add("is-leaving");
    rolls(from).forEach((w, i) =>
      run(w, { transform: `translateY(${out})`, opacity: "0" }, { duration: T.wordsOut, delay: i * T.stagger * 0.5, easing: EASE_LEAVE }));
    [...fades(from), buy(from)].forEach((el) => run(el, { opacity: "0", transform: "none" }, { duration: T.fade }));
    timers.push(window.setTimeout(() => { if (index !== from) leaving.classList.remove("is-leaving"); }, T.wordsOut + 600));

    const fresh = !items[to].classList.contains("is-leaving");
    rolls(to).forEach((w, i) =>
      run(w, { transform: "none", opacity: "1" }, { duration: T.wordsIn, delay: T.wordsInDelay + i * T.stagger, easing: EASE_OUT },
        fresh ? { transform: `translateY(${into})`, opacity: "0" } : undefined));
    items[to].classList.remove("is-leaving");
    fades(to).forEach((el, i) =>
      run(el, { opacity: "1", transform: "none" }, { duration: T.wordsIn, delay: T.wordsInDelay + 200 + i * 60, easing: EASE_OUT },
        fresh ? { opacity: "0", transform: "translateY(8px)" } : undefined));
    run(buy(to), { opacity: "1", transform: "none" }, { duration: T.wordsIn, delay: T.wordsInDelay + 80, easing: EASE_OUT },
      fresh ? { opacity: "0", transform: "translateY(6px)" } : undefined);

    counter.textContent = pad(to + 1);
    run(counter, { opacity: "1", transform: "none" }, { duration: 500, easing: EASE_OUT },
      { opacity: "0", transform: `translateY(${dir > 0 ? 40 : -40}%)` });
  }

  /** Reduced motion: everything cross-fades in place. @param {number} to @param {number} from */
  function fadeSwap(to, from) {
    const opts = { duration: T.reduced, easing: "ease" };
    set(base, { opacity: "0" });
    layers.forEach((el, i) => run(el, { opacity: i === to ? "1" : "0", transform: "none", filter: "none" }, opts));
    peeks.forEach((el, i) => run(el, { opacity: i === to + 1 ? String(peekOpacity()) : "0", transform: "none" }, opts));
    items.forEach((el, i) => {
      [...rolls(i), ...fades(i), buy(i)].forEach((c) => set(c, { opacity: "1", transform: "none" }));
      el.classList.toggle("is-leaving", i === from);
      // text fades out, then in (never two names on top of each other)
      const half = { duration: T.reduced / 2, easing: "ease" };
      if (i === to) run(el, { opacity: "1" }, { ...half, delay: T.reduced / 2 }, { opacity: "0" });
      else run(el, { opacity: "0" }, half);
    });
    timers.push(window.setTimeout(() => { if (index !== from) items[from].classList.remove("is-leaving"); }, T.reduced + 50));
    counter.textContent = pad(to + 1);
  }

  /** @param {number} to @param {boolean} animate */
  function show(to, animate) {
    if (to === index) return;
    const from = index;
    index = to;
    mark(to);
    if (!animate || from < 0) settle(to);
    else if (reduced.matches) fadeSwap(to, from);
    else swap(to, from, Math.sign(to - from));
    if (from >= 0) {
      const name = items[to].querySelector(".unk-pants__buy-name")?.textContent;
      const price = items[to].querySelector(".unk-pants__buy-price")?.textContent;
      status.textContent = `${to + 1} of ${n}: ${name}, ${price}`;
    }
  }

  function update() {
    raf = 0;
    const { p, i } = measure();
    progress.style.transform = `scaleX(${p})`;
    show(i, true);
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

  /** Scroll the page so pair `i` is in the middle of its step (used by the arrows and the peek). @param {number} i */
  function go(i) {
    if (i < 0 || i >= n) return;
    const travel = root.offsetHeight - stage.offsetHeight;
    const top = window.scrollY + root.getBoundingClientRect().top + travel * ((i + 0.5) / n);
    window.scrollTo({ top, behavior: reduced.matches ? "auto" : "smooth" });
  }
  const onPrev = () => go(index - 1);
  const onNext = () => go(index + 1);

  show(measure().i, false);
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  prev.addEventListener("click", onPrev);
  next.addEventListener("click", onNext);
  peekBox.addEventListener("click", onNext);

  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    prev.removeEventListener("click", onPrev);
    next.removeEventListener("click", onNext);
    peekBox.removeEventListener("click", onNext);
  };
}
