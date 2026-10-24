// @ts-check
/**
 * UNKNOWN pants section: behaviour. Framework-free on purpose: the Shopify theme loads this same
 * file from the section (see HANDOFF.md). No libraries.
 *
 * How it works, in plain English:
 * - The section is N screens tall and its stage is `position: sticky`, so the stage stays pinned
 *   while the page scrolls through it (pure CSS). It scrolls up over the hero with a soft shadow
 *   on its top edge. Optional: `data-under="<selector>"` makes the element above drift up at 0.75x
 *   underneath (the parallax measured in the reference). It is off by default: in testing it cost
 *   20-30% dropped frames during the entry on a machine without GPU compositing.
 * - One requestAnimationFrame loop drives everything. Scroll position is turned into a progress
 *   value `u` (0 = first pair, 1 = second pair, ...) and smoothed with a lerp, so motion is soft
 *   and a fast flick still lands exactly where the page stopped.
 * - Each pair holds still for the first and last 20% of its screen of scroll; the middle 60% plays
 *   the swap, scrubbed by scroll (so it follows the finger and plays backwards when scrolling up):
 *     1. the outgoing pair fades and drops 12px while the model in neutral pants shows under it;
 *     2. the faint grey peek of the next pair (right side) slides onto the model, staying ghosted
 *        until it lands, then turns solid; the following pair's peek slides in from the right edge;
 *     3. the name rolls up line by line (old out, new in), price, link and buy bar cross-fade.
 *   Phase timings come from reference/unknown/MOTION.md.
 * - If scrolling stops half-way through a swap, the picture eases to the nearest pair on its own
 *   (the page itself is never moved), so the section never rests on a half-finished swap and the
 *   base model never shows at rest.
 * - Only transform and opacity are written in the loop, and only when they change. Layout is read
 *   on resize only.
 * - prefers-reduced-motion: pairs and text simply cross-fade in place; nothing moves.
 */

const SMOOTH = 0.1; // s: time constant of the scroll lerp
const IDLE = 160; // ms without scrolling before a half-finished swap settles
const DROP = 12; // px the outgoing pair drops
const PAD = 0.03; // share of the section's scroll held at each end
const SWAP = [0.2, 0.8]; // part of each step that plays the swap (the rest holds still)
const PARALLAX = 0.25; // hero lags by 25% of the covered distance (moves at 0.75x)

// phase windows within a swap (0 → 1)
const P = {
  out: [0, 0.3],
  travel: [0.25, 0.85],
  solid: [0.6, 1],
  peek: [0.35, 1],
  textOut: [0.15, 0.45],
  textIn: [0.5, 0.8],
  stagger: 0.06,
  fadeOut: [0.15, 0.4],
  fadeIn: [0.55, 0.85],
};

const clamp01 = (/** @type {number} */ v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const span = (/** @type {number} */ e, /** @type {number[]} */ w) => clamp01((e - w[0]) / (w[1] - w[0]));
const easeOut = (/** @type {number} */ t) => 1 - (1 - t) ** 3;
const easeIn = (/** @type {number} */ t) => t * t * t;
const easeInOut = (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
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
  const base = q("[data-pants-base]");
  const layers = qa("[data-pants-layer]");
  const greys = qa("[data-pants-grey]");
  const items = qa("[data-pants-item]");
  const peekHit = q("[data-pants-peek]");
  const counter = q("[data-pants-current]");
  const progress = q("[data-pants-progress]");
  const status = q("[data-pants-status]");
  const prev = q("[data-pants-prev]");
  const next = q("[data-pants-next]");
  const under = root.dataset.under ? /** @type {HTMLElement | null} */ (document.querySelector(root.dataset.under)) : null;
  const n = items.length;
  if (!n || !stage) return () => {};

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fades = items.map((it) => qa("[data-pants-fade]", it).concat(qa("[data-pants-buy]", it)));
  /** @type {HTMLElement[][]} */
  let lines = items.map(() => []);

  // geometry, measured on resize only
  let top = 0;
  let travel = 1;
  let vh = 1;
  let peekX = 0;
  let edgeX = 0;
  let peekO = 0.2;

  // ---------- writing styles: only when a value changes ----------
  let cache = new WeakMap();
  /** @param {HTMLElement} el @param {number} o @param {string} [t] */
  function put(el, o, t = "none") {
    const v = Math.round(o * 1000) / 1000;
    const last = cache.get(el);
    if (last && last[0] === v && last[1] === t) return;
    cache.set(el, [v, t]);
    el.style.opacity = String(v);
    el.style.transform = t;
  }
  const tx = (/** @type {number} */ x, y = 0) => `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;

  /** Split each name into its rendered lines (so lines can roll one by one). */
  function layoutLines() {
    lines = items.map((it) => {
      const el = /** @type {HTMLElement} */ (it.querySelector("[data-pants-name]"));
      const text = (el.dataset.text ??= el.textContent?.trim() ?? "");
      el.textContent = "";
      const words = text.split(" ").map((w, i) => {
        const s = document.createElement("span");
        s.textContent = (i ? " " : "") + w;
        el.append(s);
        return s;
      });
      /** @type {string[][]} */
      const groups = [];
      let lastTop = -1;
      for (const w of words) {
        if (w.offsetTop !== lastTop) groups.push([]);
        lastTop = w.offsetTop;
        groups[groups.length - 1].push(w.textContent ?? "");
      }
      el.textContent = "";
      return groups.map((g) => {
        const line = document.createElement("span");
        line.className = "unk-pants__line";
        const inner = document.createElement("span");
        inner.textContent = g.join("").trim();
        line.append(inner);
        el.append(line);
        return inner;
      });
    });
    cache = new WeakMap();
  }

  function measure() {
    vh = window.innerHeight;
    top = root.getBoundingClientRect().top + window.scrollY;
    travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    const f = layers[0].getBoundingClientRect();
    const pk = peekHit.getBoundingClientRect();
    peekX = pk.left - f.left;
    edgeX = peekX + window.innerWidth * 0.3;
    peekO = parseFloat(getComputedStyle(root).getPropertyValue("--peek-opacity")) || 0.2;
  }

  /** Draw the state for progress u (0 … n-1). @param {number} u */
  function render(u) {
    const i = n > 1 ? Math.min(Math.floor(u), n - 2) : 0;
    const e = n > 1 ? span(u - i, SWAP) : 0;
    const cur = i;
    const nxt = i + 1;
    const rm = reduced.matches;

    // pants
    const out = span(e, P.out);
    const t = easeOut(span(e, P.travel));
    const solid = easeInOut(span(e, P.solid));
    const pk = easeOut(span(e, P.peek));
    layers.forEach((el, j) => {
      if (j === cur) put(el, rm ? 1 - e : 1 - easeInOut(out), rm ? "none" : tx(0, DROP * easeOut(out)));
      else if (j === nxt) put(el, rm ? e : solid, rm ? "none" : tx(peekX * (1 - t)));
      else put(el, 0);
    });
    greys.forEach((el, j) => {
      if (j === nxt) put(el, peekO * (rm ? 1 - e : 1 - solid), tx(rm ? peekX : peekX * (1 - t)));
      else if (j === nxt + 1) put(el, peekO * (rm ? e : pk), tx(rm ? peekX : edgeX + (peekX - edgeX) * pk));
      else put(el, 0);
    });
    const b = e <= 0 || e >= 1 || rm ? 0 : e < 0.25 ? easeOut(e / 0.25) : e < 0.7 ? 1 : 1 - easeIn((e - 0.7) / 0.3);
    put(base, b);

    // text
    items.forEach((it, j) => {
      if (j === cur) {
        put(it, rm ? 1 - e : e < 1 ? 1 : 0);
        lines[j].forEach((l, k) => {
          const r = easeInOut(span(e, [P.textOut[0] + k * P.stagger, P.textOut[1] + k * P.stagger]));
          put(l, 1, rm ? "none" : `translate3d(0, ${(-105 * r).toFixed(2)}%, 0)`);
        });
        fades[j].forEach((f) => put(f, rm ? 1 : 1 - span(e, P.fadeOut)));
      } else if (j === nxt) {
        put(it, rm ? e : e > 0 ? 1 : 0);
        lines[j].forEach((l, k) => {
          const r = easeOut(span(e, [P.textIn[0] + k * P.stagger, P.textIn[1] + k * P.stagger]));
          put(l, 1, rm ? "none" : `translate3d(0, ${(105 * (1 - r)).toFixed(2)}%, 0)`);
        });
        fades[j].forEach((f) => put(f, rm ? 1 : span(e, P.fadeIn)));
      } else put(it, 0);
    });

    progress.style.transform = `scaleX(${n > 1 ? (u / (n - 1)).toFixed(4) : 1})`;
    setActive(e < 0.5 ? cur : nxt);
  }

  // ---------- active pair: accessibility, counter, arrows ----------
  let active = -1;
  /** @param {number} a */
  function setActive(a) {
    if (a === active) return;
    const announce = active >= 0;
    active = a;
    items.forEach((it, j) => {
      const on = j === a;
      it.toggleAttribute("inert", !on);
      it.setAttribute("aria-hidden", String(!on));
    });
    counter.textContent = pad(a + 1);
    prev.setAttribute("aria-disabled", String(a === 0));
    next.setAttribute("aria-disabled", String(a === n - 1));
    if (announce) {
      const name = items[a].querySelector(".unk-pants__buy-name")?.textContent;
      const price = items[a].querySelector(".unk-pants__buy-price")?.textContent;
      status.textContent = `${a + 1} of ${n}: ${name}, ${price}`;
    }
  }

  // ---------- the loop ----------
  let target = 0;
  let shown = 0;
  let idle = true;
  let raf = 0;
  let lastT = 0;
  let idleTimer = 0;

  const fromScroll = () => {
    const p = clamp01(((window.scrollY - top) / travel - PAD) / (1 - 2 * PAD));
    return p * (n - 1);
  };
  /** Nearest rest for a progress value that is mid-swap. @param {number} u */
  const rest = (u) => {
    const i = Math.min(Math.floor(u), Math.max(0, n - 2));
    const e = span(u - i, SWAP);
    return e <= 0 || e >= 1 ? u : e < 0.5 ? i + SWAP[0] : i + SWAP[1];
  };

  function parallax() {
    if (!under) return;
    const covered = Math.min(vh, Math.max(0, window.scrollY - (top - vh)));
    under.style.transform = covered > 0 ? tx(0, covered * PARALLAX) : "";
  }

  /** @param {number} now */
  function tick(now) {
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
    lastT = now;
    const goal = idle ? rest(target) : target;
    shown += (goal - shown) * (reduced.matches ? 1 : 1 - Math.exp(-dt / SMOOTH));
    if (Math.abs(goal - shown) < 0.0005) shown = goal;
    render(shown);
    raf = shown === goal ? 0 : requestAnimationFrame(tick);
    if (!raf) lastT = 0;
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function onScroll() {
    target = fromScroll();
    parallax();
    idle = false;
    clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      idle = true;
      kick();
    }, IDLE);
    kick();
  }
  function onResize() {
    layoutLines();
    measure();
    target = fromScroll();
    parallax();
    kick();
  }

  /** Scroll the page to the resting point of pair i (arrows, peek). @param {number} i */
  function go(i) {
    if (i < 0 || i >= n) return;
    const p = n > 1 ? i / (n - 1) : 0;
    window.scrollTo({ top: top + travel * (PAD + p * (1 - 2 * PAD)), behavior: reduced.matches ? "auto" : "smooth" });
  }
  const onPrev = () => go(active - 1);
  const onNext = () => go(active + 1);

  layoutLines();
  measure();
  shown = target = rest(fromScroll());
  render(shown);
  parallax();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  prev.addEventListener("click", onPrev);
  next.addEventListener("click", onNext);
  peekHit.addEventListener("click", onNext);
  // web fonts change line breaks: re-measure once they are ready
  let alive = true;
  document.fonts?.ready.then(() => alive && onResize());

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    prev.removeEventListener("click", onPrev);
    next.removeEventListener("click", onNext);
    peekHit.removeEventListener("click", onNext);
    if (under) under.style.transform = "";
  };
}
