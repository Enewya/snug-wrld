// @ts-check
/**
 * UNKNOWN pants section: behaviour. Framework-free on purpose: the Shopify theme loads this same
 * file from the section (see HANDOFF.md). No libraries.
 *
 * How it works, in plain English:
 * - The hero above is held in place (CSS sticky) while this section rises over it with a
 *   feathered, misty top edge; once its top reaches the top of the screen the stage pins (CSS
 *   sticky) for N+1 screens of scrolling.
 * - Layers, on one fixed canvas: the body (torso, arms, shoes) never moves or fades; above it the
 *   pants of each state (pants only); above those the hands, so they stay in front of any pants.
 *   Only the pants layers move.
 * - States: 0 = the model in the neutral base chinos, 1..N = each pair. At rest on a state, only
 *   that state's pants show, with the next pair waiting as a faint grey ghost (pants only) at the
 *   right.
 * - One requestAnimationFrame loop drives everything. Scroll position becomes a progress value
 *   `u` (0 = base, 1 = first pair, ...) smoothed with a lerp, so motion is soft and a fast flick
 *   still lands exactly where the page stopped. Each state holds still for the first and last 20%
 *   of its screen; the middle 60% scrubs the swap (it follows the scroll and plays backwards):
 *     1. the ghost slides left onto the body (ease-out), still faint;
 *     2. it turns solid (grey copy fades out, colour copy fades in);
 *     3. only then do the outgoing pants fade, drifting 2% of the frame to the LEFT (a short
 *        overlap, so the legs are never see-through);
 *     4. the following pair's ghost slides in from beyond the right edge;
 *     the name rolls up line by line; the price and the View product link cross-fade (the link
 *     moves under the incoming pair's price while it is invisible, and points at that pair).
 *   Timings: reference/unknown/MOTION.md (v2 table).
 * - The cloud layers (pre-rendered WebP) drift sideways with progress at two speeds for depth,
 *   and rise a little slower than the section during the entry.
 * - If scrolling stops half-way through a swap, the picture eases to the nearest state on its own
 *   (the page itself is never moved).
 * - Only transform and opacity are written in the loop, and only when they change. Layout is read
 *   on resize only. All pair images are decoded up front (img.decode()) so the first swap of a
 *   fresh visit never waits for a decode.
 * - prefers-reduced-motion: images, ghost and text cross-fade in place; nothing moves.
 */

const SMOOTH = 0.1; // s: time constant of the scroll lerp
const IDLE = 160; // ms without scrolling before a half-finished swap settles
const DRIFT = 0.02; // outgoing drift to the left, as a share of the frame width
const SWAP = [0.2, 0.8]; // part of each step that plays the swap (the rest holds still)
// Scroll lengths, in screens (must match the section height in pants-section.css): a 0.12 lead-in
// held on the first state, then 0.94 per state. The section ends where the last pair has settled
// (u = n - 2 + SWAP[1]), so it releases immediately: no dead scroll after the last pair.
const LEAD = 0.12;
const STEP = 0.94;

// phase windows within a swap (0 → 1), from reference/unknown/MOTION.md (v2)
const P = {
  travel: [0.05, 0.8],
  solid: [0.5, 0.85],
  out: [0.7, 0.95],
  drift: [0.4, 1],
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
  const figure = q(".unk-pants__figure");
  const colour = qa("[data-pants-layer]"); // pants only: [base chinos, pair 1, ... pair N]
  const fixed = qa("[data-pants-body], [data-pants-hands]"); // never move
  const greys = qa("[data-pants-grey]"); // [pair 1, ... pair N]
  const items = qa("[data-pants-item]"); // [intro, pair 1, ... pair N]
  const peekHit = q("[data-pants-peek]");
  const cloudBack = q('[data-cloud="back"]');
  const cloudFront = q('[data-cloud="front"]');
  const mist = q('[data-cloud="mist"]');
  const feather = q(".unk-pants__feather");
  const counter = q("[data-pants-current]");
  const progress = q("[data-pants-progress]");
  const status = q("[data-pants-status]");
  const prev = q("[data-pants-prev]");
  const next = q("[data-pants-next]");
  const n = items.length; // states
  if (n < 2 || !stage) return () => {};
  /** grey copy of state s (s >= 1) @param {number} s */
  const grey = (s) => greys[s - 1];

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fades = items.map((it) => qa("[data-pants-fade]", it));
  const view = q("[data-pants-view]");
  const cta = /** @type {HTMLAnchorElement} */ (q("[data-pants-cta]"));
  // pair k (1 … N): its product URL and name, for the one View product link
  const pairs = items.slice(1).map((it) => ({ url: it.dataset.url ?? "", name: it.dataset.name ?? "" }));
  /** height of each state's text block (name + price), so the link sits under the right one */
  let textH = items.map(() => 0);
  /** @type {HTMLElement[][]} */
  let lines = items.map(() => []);

  // geometry, measured on resize only
  let top = 0;
  let travel = 1;
  let vh = 1;
  let vw = 1;
  let frameW = 1;
  let peekX = 0;
  let edgeX = 0;
  let peekO = 0.2;

  // ---------- writing styles: only when a value changes ----------
  let cache = new WeakMap();
  /** @param {HTMLElement | undefined} el @param {number} o @param {string} [t] */
  function put(el, o, t = "none") {
    if (!el) return;
    const v = Math.round(o * 1000) / 1000;
    const last = cache.get(el);
    if (last && last[0] === v && last[1] === t) return;
    cache.set(el, [v, t]);
    el.style.opacity = String(v);
    el.style.transform = t;
  }
  /** @param {HTMLElement} el @param {string} t */
  function move(el, t) {
    if (!el || cache.get(el) === t) return;
    cache.set(el, t);
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
      // (inline boxes can start above the line box, e.g. offsetTop -1, so no numeric sentinel)
      let lastTop = Number.NaN;
      for (const w of words) {
        if (groups.length === 0 || w.offsetTop !== lastTop) groups.push([]);
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
    vw = window.innerWidth / 100;
    // the warm-up below moves the section with a transform for a few frames; read its place without
    // it (a re-measure during warm-up, e.g. on fonts ready, used to shift every state on desktop)
    const warmT = root.style.transform;
    root.style.transform = "";
    top = root.getBoundingClientRect().top + window.scrollY;
    root.style.transform = warmT;
    travel = Math.max(1, root.offsetHeight - stage.offsetHeight);
    const f = figure.getBoundingClientRect(); // the canvas (each layer is cropped to its content)
    const pk = peekHit.getBoundingClientRect();
    frameW = f.width;
    peekX = pk.left - f.left;
    edgeX = peekX + window.innerWidth * 0.3;
    peekO = parseFloat(getComputedStyle(root).getPropertyValue("--peek-opacity")) || 0.2;
    textH = items.map((it) => /** @type {HTMLElement} */ (it.querySelector(".unk-pants__info"))?.offsetHeight ?? 0);
    placeView();
  }
  /** the View product link under the active pair's price (a CSS variable; read by the stylesheet) */
  function placeView() {
    view.style.setProperty("--view-y", `${textH[Math.max(0, active)] ?? 0}px`);
  }

  /** Draw the state for progress u (0 … n-1). @param {number} u */
  function render(u) {
    const i = Math.min(Math.floor(u), n - 2);
    const e = span(u - i, SWAP);
    const cur = i;
    const nxt = i + 1;
    const rm = reduced.matches;

    // pants
    const t = easeOut(span(e, P.travel));
    const solid = easeInOut(span(e, P.solid));
    const out = easeInOut(span(e, P.out));
    const drift = -DRIFT * frameW * easeInOut(span(e, P.drift));
    const pk = easeOut(span(e, P.peek));
    colour.forEach((el, s) => {
      if (s === cur) put(el, rm ? 1 - e : 1 - out, rm ? "none" : tx(drift));
      else if (s === nxt) put(el, rm ? e : solid, rm ? "none" : tx(peekX * (1 - t)));
      else put(el, 0);
    });
    for (let s = 1; s < n; s++) {
      const el = grey(s);
      if (s === nxt) put(el, peekO * (rm ? 1 - e : 1 - solid), tx(rm ? peekX : peekX * (1 - t)));
      else if (s === nxt + 1) put(el, peekO * (rm ? e : pk), tx(rm ? peekX : edgeX + (peekX - edgeX) * pk));
      else put(el, 0);
    }

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

    // the View product link: with the price of a pair, none on the intro (state 0)
    const vOut = cur > 0 ? (rm ? 1 - e : 1 - span(e, P.fadeOut)) : 0;
    const vIn = rm ? e : span(e, P.fadeIn);
    put(view, vOut + vIn); // (the two never overlap: fadeOut ends before fadeIn starts)

    // atmosphere: clouds drift with progress at two speeds (depth)
    if (!rm) {
      move(cloudBack, tx(-u * 0.8 * vw, cloudLift * 0.5));
      move(cloudFront, tx(-u * 1.8 * vw, cloudLift * 0.25));
      move(mist, tx(u * 0.6 * vw));
    }

    progress.style.transform = `scaleX(${(u / (n - 1)).toFixed(4)})`;
    setActive(e < 0.5 ? cur : nxt);
  }

  // entry: while the section is still rising, the clouds rise a little slower than it
  let cloudLift = 0;
  function entry() {
    const below = Math.min(1, Math.max(0, (top - window.scrollY) / vh)); // 1 = section top at the bottom edge
    cloudLift = -below * vh * 0.2;
    // the feather sits over the hero's lower third: keep it hidden while the page is at rest on the
    // hero (so the hero matches the draft) and fade it in over the first 8% of the rise
    put(feather, Math.min(1, Math.max(0, (1 - below) / 0.08)));
  }

  // ---------- active state: accessibility, counter, arrows ----------
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
    counter.textContent = a === 0 ? "—" : pad(a);
    // the one View product link always points at the pair on screen; on the intro it is out of reach
    const pair = pairs[Math.max(0, a - 1)];
    if (pair) {
      cta.href = pair.url;
      cta.setAttribute("aria-label", `View ${pair.name}`);
    }
    cta.tabIndex = a === 0 ? -1 : 0;
    cta.setAttribute("aria-hidden", String(a === 0));
    placeView();
    prev.setAttribute("aria-disabled", String(a === 0));
    next.setAttribute("aria-disabled", String(a === n - 1));
    if (announce && a > 0) {
      const name = pairs[a - 1]?.name;
      const price = items[a].querySelector(".unk-pants__price")?.textContent;
      status.textContent = `${a} of ${n - 1}: ${name}, ${price}`;
    }
  }

  // ---------- the loop ----------
  let target = 0;
  let shown = 0;
  let idle = true;
  let raf = 0;
  let lastT = 0;
  let idleTimer = 0;

  // last settled progress value; from here to n - 1 the picture is identical (the swap is done)
  const uEnd = () => n - 2 + SWAP[1];
  const lead = () => LEAD / (LEAD + uEnd() * STEP); // share of the travel held before the first swap
  const fromScroll = () => {
    const u = clamp01(((window.scrollY - top) / travel - lead()) / (1 - lead())) * uEnd();
    return u >= uEnd() - 1e-4 ? n - 1 : u;
  };
  /** Nearest rest for a progress value that is mid-swap. @param {number} u */
  const rest = (u) => {
    const i = Math.min(Math.floor(u), n - 2);
    const e = span(u - i, SWAP);
    return e <= 0 || e >= 1 ? u : e < 0.5 ? i + SWAP[0] : i + SWAP[1];
  };

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
    entry();
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
    entry();
    kick();
  }

  /** Scroll the page to the resting point of state i (arrows, peek). @param {number} i */
  function go(i) {
    if (i < 0 || i >= n) return;
    const u = Math.min(i, uEnd());
    window.scrollTo({ top: top + travel * (lead() + (1 - lead()) * (u / uEnd())), behavior: reduced.matches ? "auto" : "smooth" });
  }
  const onPrev = () => go(active - 1);
  const onNext = () => go(active + 1);

  // decode every pair image up front, off the critical path, so no swap waits for a decode; then
  // warm up: for two frames, invisibly (opacity 0.001) lay the section over the hero exactly as in
  // the entry, so the browser does its one-time drawing work while the visitor is still on the
  // hero instead of during the first scroll (measured: the first pass otherwise drops frames,
  // later passes don't).
  let alive = true;
  const predecode = () => {
    if (!alive) return;
    const decode = (/** @type {HTMLElement[]} */ list) => Promise.all(list.filter(Boolean).map((node) => {
      // the mist is a stretched CSS background: decode its file through a detached image
      const url = node instanceof HTMLImageElement ? "" : /url\(["']?(.*?)["']?\)/.exec(node.style.backgroundImage)?.[1];
      const el = url ? Object.assign(new Image(), { src: url }) : /** @type {HTMLImageElement} */ (node);
      el.loading = "eager";
      return el.decode ? el.decode().catch(() => {}) : Promise.resolve();
    }));
    // what the entry shows first (base, first pair + its ghost, clouds), then warm, then the rest
    decode([...fixed, colour[0], colour[1], greys[0], cloudBack, cloudFront, mist])
      .then(warm)
      .then(() => decode([...colour.slice(2), ...greys.slice(1)]));
  };
  const warm = () => {
    if (!alive || window.scrollY > 0 || reduced.matches) return;
    const r = root.getBoundingClientRect();
    if (r.top < window.innerHeight) return; // already in view: nothing to warm
    // three overlap positions (as in the entry), ~7 frames each, then back
    const spots = [0.75, 0.45, 0.1];
    let f = 0;
    root.style.opacity = "0.001";
    const step = () => {
      if (!alive || window.scrollY > 0 || f >= spots.length * 7) {
        root.style.transform = "";
        root.style.opacity = "";
        return;
      }
      root.style.transform = `translate3d(0, ${-(r.top - window.innerHeight * spots[Math.floor(f / 7)])}px, 0)`;
      f++;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(predecode, { timeout: 600 });
  else setTimeout(predecode, 200);

  layoutLines();
  measure();
  entry();
  shown = target = rest(fromScroll());
  render(shown);
  // the scroll listener is only attached while the section is within a screen of the viewport:
  // elsewhere on the page (the lookbook, the footer) scrolling runs none of this code
  let listening = false;
  const listen = (/** @type {boolean} */ on) => {
    if (on === listening) return;
    listening = on;
    if (on) window.addEventListener("scroll", onScroll, { passive: true });
    else window.removeEventListener("scroll", onScroll);
    onScroll(); // catch up (on leaving: settle on where the page stopped)
  };
  const near = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => listen(entries[entries.length - 1].isIntersecting), { rootMargin: "100% 0px" })
    : null;
  if (near) near.observe(root);
  else listen(true);
  window.addEventListener("resize", onResize);
  prev.addEventListener("click", onPrev);
  next.addEventListener("click", onNext);
  peekHit.addEventListener("click", onNext);
  // web fonts change line breaks: re-measure once they are ready
  document.fonts?.ready.then(() => alive && onResize());

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    clearTimeout(idleTimer);
    near?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    prev.removeEventListener("click", onPrev);
    next.removeEventListener("click", onNext);
    peekHit.removeEventListener("click", onNext);
  };
}
