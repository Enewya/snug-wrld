// @ts-check
/**
 * UNKNOWN mobile rack: behaviour. Framework-free (the theme loads this same file). No libraries.
 * Every value in CONFIG is measured from the client's reel (reference/unknown/MOTION.md, "v4");
 * only RUBBER is not (the reel never reaches an end).
 *
 * In plain English:
 * - The rail never moves; only the garments do.
 * - Drag: once a touch has moved 6px more sideways than up/down, the garments follow the finger
 *   1:1 (vertical swipes are left to the browser, so the page still scrolls: touch-action: pan-y).
 * - First load: every garment shows its side view and they hang evenly spaced. Nothing turns
 *   to the front until the visitor has dragged the row at least once (brief, round 8).
 * - Release: the row glides on with the finger's speed and slows down exponentially (time
 *   constant 100ms). It is not snapped mid-glide; where it comes to rest, it waits 300ms, then the
 *   garment nearest the centre is eased into the centre (300ms) while its neighbours move out
 *   10.9vw each side (400ms) and its side photo cross-fades to its front photo (100ms).
 * - Grabbing the row again turns the front back to the side and closes the gap.
 * - Every hanger sways a little about its hook, like a pendulum (period 1.37s, damped): the hem
 *   lags when the row speeds up and swings on when it slows down.
 * - Ends: dragging past the first / last garment meets resistance (RUBBER) and springs back.
 * - Tap the centred garment (or Enter / Space on it) to open the focus view; tap another garment
 *   to bring it to the centre. Left / right arrow keys move one garment.
 * - One requestAnimationFrame loop, only while something moves; it writes transform and opacity
 *   only (plus a z-index and the caption text when the centred garment changes). Layout is read on
 *   resize only.
 * - prefers-reduced-motion: dragging still works; the row snaps without gliding, the side / front
 *   swap and the gap are instant, nothing sways.
 */
const CONFIG = {
  TAU: 100, // ms, glide decay time constant (measured: speed x0.715 per 33.3ms)
  DWELL: 300, // ms at rest before the centre garment turns to the front (measured)
  CENTRE_MS: 300, // ms, eased move that centres the garment (measured, ease-in-out)
  SPREAD_MS: 400, // ms, neighbours moving out (measured, ease-out)
  FADE_DELAY: 100, // ms into the spread before the cross-fade starts (measured)
  FADE_MS: 100, // ms, side -> front cross-fade (measured)
  PUSH_VW: 10.9, // vw each neighbour moves out from a front-facing garment (measured)
  SWAY_PERIOD: 1.37, // s (measured)
  SWAY_DAMPING: 0.2, // damping ratio (measured: about half the amplitude per half swing)
  SWAY_GAIN: 0.00276, // rad of swing per vw/s^2 of row acceleration (fitted to the measured 3.9deg peak)
  RUBBER: 0.35, // share of the finger's travel applied past either end (NOT measured: the reel never reaches an end)
  DRAG_START: 6, // px of movement before a gesture counts as a drag
  VELOCITY_WINDOW: 100, // ms of pointer history used for the release speed
  REST_SPEED: 0.01, // px/ms below which a glide counts as stopped
};

/** @typedef {{ x: number, y: number, iw: number, rod: number, hovered: boolean, bodyScale?: number }} Origin */
/** @typedef {{ origin: (i: number) => Origin | null, jumpTo: (i: number) => void, resume: () => void, destroy: () => void }} MobileRackApi */
/** @typedef {{ from: number, to: number, t0: number, dur: number, ease: (t: number) => number }} Tween */

const easeInOut = (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (/** @type {number} */ t) => 1 - (1 - t) ** 3;
const linear = (/** @type {number} */ t) => t;

/**
 * @param {HTMLElement} root the `.umr` element
 * @param {{ onSelect: (index: number, origin: Origin) => void }} opts
 * @returns {MobileRackApi}
 */
export function initMobileRack(root, { onSelect }) {
  const track = /** @type {HTMLElement} */ (root.querySelector("[data-umr-track]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-umr-item]")]);
  const garments = items.map((it) => /** @type {HTMLElement} */ (it.querySelector(".umr__garment")));
  const sides = items.map((it) => /** @type {HTMLElement} */ (it.querySelector("[data-umr-side]")));
  const fronts = items.map((it) => /** @type {HTMLElement} */ (it.querySelector("[data-umr-front]")));
  const hits = items.map((it) => /** @type {HTMLButtonElement} */ (it.querySelector("[data-umr-hit]")));
  const caption = root.querySelector("[data-umr-caption]");
  const n = items.length;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!n || !track) return { origin: () => null, jumpTo: () => {}, resume: () => {}, destroy: () => {} };

  // ---------- state ----------
  let pitch = 1; // px between hangers (read on resize)
  let vw = window.innerWidth / 100;
  let iw = 1; // rendered photo width, px
  let rod = 1;
  let pos = 0; // continuous index of the garment in the centre (past the ends while dragging)
  /** rest | pending | drag | glide | dwell | centre */
  let mode = "rest";
  /** @type {{ id: number, x: number, y: number, pos: number, samples: { t: number, pos: number }[] } | null} */
  let gesture = null;
  let glide = { from: 0, v: 0, t0: 0 }; // v in garments per ms
  let dwellAt = 0;
  /** @type {Tween | null} */ let centreTw = null;
  let centre = 0; // garment whose front shows / is being turned
  let spread = 0; // 0 = even spacing, 1 = neighbours of `centre` pushed out
  let face = 0; // front photo opacity of `centre`
  let dragged = false; // the turn to the front is only allowed after the first drag
  /** @type {Tween | null} */ let spreadTw = null;
  /** @type {Tween | null} */ let faceTw = null;
  let dragEndedAt = -1e9; // a click right after a drag is the drag's own, not a tap
  // sway: one pendulum for the whole row (every hanger feels the same acceleration)
  let th = 0; // rad
  let om = 0; // rad/s
  let lastX = 0; // row position (vw) and speed (vw/s) on the previous frame
  let lastV = 0;
  let raf = 0;
  let last = 0;

  /** @param {Tween | null} tw @param {number} now */
  const val = (tw, now) => (tw ? tw.from + (tw.to - tw.from) * tw.ease(Math.min(1, Math.max(0, (now - tw.t0) / tw.dur))) : 0);
  /** @param {Tween | null} tw @param {number} now */
  const done = (tw, now) => !tw || now - tw.t0 >= tw.dur;

  // ---------- writes (only when the value changes) ----------
  /** @type {WeakMap<HTMLElement, Record<string, string>>} */
  const cache = new WeakMap();
  /** @param {HTMLElement} el @param {string} prop @param {string} v */
  const write = (el, prop, v) => {
    let c = cache.get(el);
    if (!c) cache.set(el, (c = {}));
    if (c[prop] === v) return;
    c[prop] = v;
    el.style.setProperty(prop, v);
  };

  function measure() {
    vw = window.innerWidth / 100;
    const a = items[0].getBoundingClientRect();
    const b = items[1]?.getBoundingClientRect();
    // the spread shifts the items, so read the base pitch from the CSS custom property instead
    const cs = getComputedStyle(root);
    pitch = parseFloat(cs.getPropertyValue("--umr-pitch-px")) || (b ? b.left - a.left : window.innerWidth / 3);
    iw = parseFloat(cs.getPropertyValue("--umr-iw-px")) || window.innerWidth * 0.55;
    rod = parseFloat(getComputedStyle(/** @type {HTMLElement} */ (root.querySelector(".umr__rail"))).height) || 5;
  }

  function render() {
    write(track, "transform", `translate3d(${(-pos * pitch).toFixed(2)}px, 0, 0)`);
    const push = CONFIG.PUSH_VW * vw * spread;
    const swing = reduced.matches ? "" : ` rotate(${((th * 180) / Math.PI).toFixed(3)}deg)`;
    for (let i = 0; i < n; i++) {
      const dx = i === centre ? 0 : Math.sign(i - centre) * push;
      write(items[i], "transform", `translate3d(${dx.toFixed(2)}px, 0, 0)`);
      write(garments[i], "transform", swing || "none");
      const f = i === centre ? face : 0;
      write(sides[i], "opacity", (1 - f).toFixed(3));
      write(fronts[i], "opacity", f.toFixed(3));
    }
  }

  /** @param {number} c */
  function setCentre(c) {
    if (c === centre) return;
    centre = c;
    items.forEach((it, i) => {
      it.style.zIndex = String(i === c ? 3 : 1);
      hits[i].tabIndex = i === c ? 0 : -1;
    });
    if (caption) caption.textContent = hits[c].getAttribute("aria-label");
  }

  /** turn the centred garment back to its side and close the gap (row about to move) @param {number} now */
  function unturn(now) {
    if (spread === 0 && face === 0 && !spreadTw && !faceTw) return;
    if (reduced.matches) {
      spread = 0; face = 0; spreadTw = faceTw = null;
      return;
    }
    spreadTw = { from: spread, to: 0, t0: now, dur: CONFIG.SPREAD_MS, ease: easeOut };
    faceTw = { from: face, to: 0, t0: now, dur: CONFIG.FADE_MS, ease: linear };
  }
  /** centre garment c and (once the row has been dragged) turn it to the front
   *  @param {number} c @param {number} now */
  function turnTo(c, now) {
    const to = Math.max(0, Math.min(n - 1, c));
    const on = dragged ? 1 : 0;
    if (reduced.matches) {
      pos = to; setCentre(to); spread = on; face = on; spreadTw = faceTw = centreTw = null;
      mode = "rest";
      return;
    }
    // a different garment: the old one is already back to its side (unturn on grab / glide)
    if (to !== centre) { spread = 0; face = 0; setCentre(to); }
    centreTw = { from: pos, to, t0: now, dur: CONFIG.CENTRE_MS, ease: easeInOut };
    spreadTw = { from: spread, to: on, t0: now, dur: CONFIG.SPREAD_MS, ease: easeOut };
    faceTw = { from: face, to: on, t0: now + CONFIG.FADE_DELAY, dur: CONFIG.FADE_MS, ease: linear };
    mode = "centre";
  }

  // ---------- the loop ----------
  /** @param {number} now */
  function tick(now) {
    const dt = last ? Math.min(0.032, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = mode === "drag" || mode === "pending";

    if (mode === "glide") {
      const t = now - glide.t0;
      const k = Math.exp(-t / CONFIG.TAU);
      pos = glide.from + glide.v * CONFIG.TAU * (1 - k);
      // past an end the glide is caught by the rubber band and eased back
      if (pos < -0.15 || pos > n - 0.85) {
        turnTo(pos < 0 ? 0 : n - 1, now);
      } else if (Math.abs(glide.v * k) * pitch < CONFIG.REST_SPEED) {
        mode = "dwell";
        dwellAt = now;
      }
      moving = true;
    }
    if (mode === "dwell") {
      if (now - dwellAt >= CONFIG.DWELL) turnTo(Math.round(pos), now);
      moving = true;
    }
    if (mode === "centre") {
      pos = val(centreTw, now);
      if (done(centreTw, now) && done(spreadTw, now) && done(faceTw, now)) { pos = centreTw ? centreTw.to : pos; mode = "rest"; }
      moving = true;
    }
    if (spreadTw) { spread = val(spreadTw, now); if (done(spreadTw, now)) { spread = spreadTw.to; spreadTw = null; } else moving = true; }
    if (faceTw) { face = now < faceTw.t0 ? faceTw.from : val(faceTw, now); if (done(faceTw, now)) { face = faceTw.to; faceTw = null; } else moving = true; }
    // while the row moves freely, the garment nearest the centre is the one that will turn
    if ((mode === "drag" || mode === "glide") && spread === 0 && face === 0) setCentre(Math.max(0, Math.min(n - 1, Math.round(pos))));

    // sway: damped pendulum driven by the row's acceleration (vw/s^2)
    if (!reduced.matches) {
      const x = (-pos * pitch) / vw;
      const v = (x - lastX) / dt;
      const a = (v - lastV) / dt;
      lastX = x;
      lastV = v;
      const w = (2 * Math.PI) / CONFIG.SWAY_PERIOD;
      const sub = 4;
      for (let s = 0; s < sub; s++) {
        const h = dt / sub;
        om += (-w * w * th - 2 * CONFIG.SWAY_DAMPING * w * om - CONFIG.SWAY_GAIN * a) * h;
        th += om * h;
      }
      if (Math.abs(th) > 0.0005 || Math.abs(om) > 0.002) moving = true;
      else { th = 0; om = 0; }
    }

    render();
    raf = moving ? requestAnimationFrame(tick) : 0;
    if (!raf) { last = 0; lastV = 0; }
  }
  const kick = () => {
    if (!raf) {
      lastX = (-pos * pitch) / vw;
      raf = requestAnimationFrame(tick);
    }
  };

  // ---------- pointer ----------
  /** past the ends, the finger's travel only counts RUBBER of the way @param {number} p */
  const rubber = (p) => (p < 0 ? p * CONFIG.RUBBER : p > n - 1 ? n - 1 + (p - (n - 1)) * CONFIG.RUBBER : p);

  /** @param {PointerEvent} e */
  function onDown(e) {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    // grabbing a moving row stops it where it is
    if (mode === "glide" || mode === "centre" || mode === "dwell") mode = "rest";
    gesture = { id: e.pointerId, x: e.clientX, y: e.clientY, pos, samples: [{ t: e.timeStamp, pos }] };
    mode = "pending";
  }
  /** @param {PointerEvent} e */
  function onMove(e) {
    if (!gesture || e.pointerId !== gesture.id) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;
    if (mode === "pending") {
      if (Math.abs(dy) > CONFIG.DRAG_START && Math.abs(dy) > Math.abs(dx)) {
        // vertical: the page scrolls (the browser takes the gesture and cancels the pointer)
        gesture = null;
        mode = "rest";
        kick();
        return;
      }
      if (Math.abs(dx) < CONFIG.DRAG_START || Math.abs(dx) < Math.abs(dy)) return;
      mode = "drag";
      dragged = true;
      unturn(e.timeStamp);
      try { root.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    }
    if (mode !== "drag") return;
    pos = rubber(gesture.pos - dx / pitch);
    gesture.samples.push({ t: e.timeStamp, pos });
    while (gesture.samples.length > 2 && e.timeStamp - gesture.samples[0].t > CONFIG.VELOCITY_WINDOW) gesture.samples.shift();
    kick();
  }
  /** @param {PointerEvent} e */
  function onUp(e) {
    if (!gesture || e.pointerId !== gesture.id) return;
    const wasDrag = mode === "drag";
    const s = gesture.samples;
    gesture = null;
    if (!wasDrag) {
      // a tap: handled by the button's click; a still row turns its centre garment (again)
      if (dragged && (spread < 1 || face < 1)) turnTo(Math.round(pos), e.timeStamp);
      else mode = "rest";
      kick();
      return;
    }
    dragEndedAt = e.timeStamp;
    const a = s[0];
    const b = s[s.length - 1];
    const v = b.t > a.t ? (b.pos - a.pos) / (b.t - a.t) : 0; // garments per ms
    const now = performance.now();
    if (reduced.matches || pos < 0 || pos > n - 1) {
      turnTo(reduced.matches ? Math.round(pos + v * CONFIG.TAU) : pos < 0 ? 0 : n - 1, now);
    } else {
      glide = { from: pos, v, t0: now };
      mode = "glide";
    }
    kick();
  }
  /** @param {PointerEvent} e */
  function onCancel(e) {
    if (!gesture || e.pointerId !== gesture.id) return;
    gesture = null;
    turnTo(Math.round(pos), performance.now());
    kick();
  }

  /** @param {MouseEvent} e */
  function onClick(e) {
    if (e.timeStamp - dragEndedAt < 400) {
      e.preventDefault();
      return;
    }
    const hit = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-umr-hit]"));
    if (!hit) return;
    const i = Number(hit.dataset.index);
    // the centred garment opens: turned to its front, or on its side before the first drag
    if (i === centre && mode === "rest" && (face === 1 || !dragged)) {
      const o = origin(i);
      if (o) onSelect(i, o);
    } else {
      unturn(performance.now());
      turnTo(i, performance.now());
      kick();
    }
  }
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = Math.max(0, Math.min(n - 1, centre + (e.key === "ArrowRight" ? 1 : -1)));
    turnTo(next, performance.now());
    kick();
    hits[next].focus({ preventScroll: true });
  }

  /** Where garment i hangs right now (for the focus view's flight). @param {number} i @returns {Origin | null} */
  function origin(i) {
    const it = items[i];
    if (!it) return null;
    const r = it.getBoundingClientRect();
    return { x: r.left, y: r.top, iw, rod, hovered: i === centre && face > 0.5, bodyScale: 1 };
  }
  /** Put garment i in the centre at once, on its side view (the focus view flies back to the side
   *  view), while the focus view covers the rack. @param {number} i */
  function jumpTo(i) {
    pos = Math.max(0, Math.min(n - 1, i));
    mode = "rest";
    centreTw = spreadTw = faceTw = null;
    setCentre(pos);
    spread = dragged ? 1 : 0;
    face = 0;
    th = om = 0;
    render();
  }
  /** After the focus view has closed: rest, then turn the centre garment to its front as usual
   *  (only once the row has been dragged; before that it stays on its side). */
  function resume() {
    mode = "dwell";
    dwellAt = performance.now();
    kick();
  }

  const onResize = () => {
    measure();
    render();
  };

  // first paint: garment 0 in the centre, every garment on its side, evenly spaced (as server-rendered)
  measure();
  items.forEach((it, i) => (it.style.zIndex = String(i === 0 ? 3 : 1)));
  render();

  // decode every photo once the page is idle, so a fast fling never waits for a decode
  const decodeAll = () => root.querySelectorAll("img").forEach((img) => {
    img.loading = "eager";
    img.decode().catch(() => {});
  });
  const hasIdle = typeof window.requestIdleCallback === "function";
  const idle = hasIdle ? window.requestIdleCallback(decodeAll, { timeout: 1500 }) : window.setTimeout(decodeAll, 600);

  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onCancel);
  root.addEventListener("click", onClick, true);
  root.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);

  return {
    origin,
    jumpTo,
    resume,
    destroy() {
      cancelAnimationFrame(raf);
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onCancel);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    },
  };
}
