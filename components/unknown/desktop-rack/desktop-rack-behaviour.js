// @ts-check
/**
 * UNKNOWN desktop rack (600px and up): scrolling. Framework-free (the theme loads this same file).
 * No libraries. Hover, the turn to the front and click-to-open stay in the shared rack code; this
 * file only moves the row along the rail.
 *
 * In plain English:
 * - The rail never moves; only the garments do. The first garment starts one margin step from the
 *   left bracket; the row runs on past the right bracket, where it is clipped (as on phones).
 * - Mouse / pen drag: once the pointer has moved 6px more sideways than up/down, the row follows it
 *   1:1. Touch drags the same way; vertical swipes are left to the browser (touch-action: pan-y).
 * - Trackpad: horizontal two-finger scroll moves the row (the trackpad's own momentum carries it);
 *   vertical scroll is never taken, so the page always scrolls. Shift + mouse wheel also works.
 * - Left / right arrow keys (rack focused) move one garment.
 * - Release: the row glides on with the drag's speed and slows down exponentially (time constant
 *   100ms, the phone rack's measured value), then eases (300ms) so a garment lines up with the
 *   left start. Past either end it meets resistance and springs back.
 * - One requestAnimationFrame loop, only while something moves; it writes one CSS custom property
 *   (--udr-offset, px) on the clip box. Layout is read on resize only.
 * - prefers-reduced-motion: no glide; the row settles instantly.
 */
const CONFIG = {
  TAU: 100, // ms, glide decay time constant (phone rack, measured from the reel)
  SETTLE_MS: 300, // ms, eased move onto the nearest garment (phone rack's centring time)
  RUBBER: 0.35, // share of the travel applied past either end (phone rack)
  DRAG_START: 6, // px before a gesture counts as a drag
  VELOCITY_WINDOW: 100, // ms of pointer history used for the release speed
  REST_SPEED: 0.02, // px/ms below which a glide counts as stopped
  WHEEL_IDLE: 140, // ms without wheel events before the row settles
  MAX_SPEED: 4, // px/ms cap on the release speed
};

/** @typedef {{ offset: () => number, isDragging: () => boolean, justDragged: () => boolean, reveal: (i: number) => void, destroy: () => void }} DesktopRackApi */

const easeInOut = (/** @type {number} */ t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * @param {HTMLElement} root the `.udr` element (holds `[data-udr-clip]` and the `.rack-item`s)
 * @param {{ onMove?: () => void }} [opts] called when the row starts moving (to drop hover)
 * @returns {DesktopRackApi}
 */
export function initDesktopRack(root, opts = {}) {
  const clip = /** @type {HTMLElement} */ (root.querySelector("[data-udr-clip]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll(".rack-item")]);
  const n = items.length;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  let pitch = 1; // px between garments
  let span = 1; // px between the brackets
  let max = 0; // px, furthest offset (last garment one margin from the right bracket)
  let x = 0; // current offset, px (past the ends while dragging)
  /** rest | pending | drag | glide | settle | wheel */
  let mode = "rest";
  /** @type {{ id: number, x: number, y: number, start: number, samples: { t: number, x: number }[] } | null} */
  let g = null;
  let glide = { from: 0, v: 0, t0: 0 };
  let tw = { from: 0, to: 0, t0: 0 };
  let wheelAt = 0;
  let dragEndedAt = -1e9;
  let raf = 0;
  let written = "";

  function measure() {
    if (n < 2) return;
    const off = x;
    const a = items[0].getBoundingClientRect().left;
    const b = items[1].getBoundingClientRect().left;
    pitch = b - a || 1;
    const cs = getComputedStyle(root);
    // the clip edges are the brackets' inner faces
    const left = root.querySelector(".udr__rail .rail-end.l")?.getBoundingClientRect().right ?? 0;
    const right = root.querySelector(".udr__rail .rail-end.r")?.getBoundingClientRect().left ?? window.innerWidth;
    const margin = parseFloat(cs.getPropertyValue("--udr-margin")) || 24;
    const iw = (parseFloat(cs.getPropertyValue("--iw-px")) || 0) * (parseFloat(cs.getPropertyValue("--garment-scale")) || 1);
    // the last garment's right edge (share of the photo width, from its side photo) one margin from the bracket
    const reach = (parseFloat(root.dataset.reach || "0") || 0) * iw;
    span = right - left;
    // where the last garment's centre sits at offset 0, then how far it has to travel
    const lastAt0 = items[n - 1].getBoundingClientRect().left + off;
    max = Math.max(0, lastAt0 + reach + margin - right);
  }

  const clamp = (/** @type {number} */ v) => Math.max(0, Math.min(max, v));
  /** nearest resting point: a garment on the left start, or the far end */
  const snap = (/** @type {number} */ v) => {
    const c = clamp(v);
    if (max - c < pitch / 2) return max;
    return clamp(Math.round(c / pitch) * pitch);
  };
  const rubber = (/** @type {number} */ v) => (v < 0 ? v * CONFIG.RUBBER : v > max ? max + (v - max) * CONFIG.RUBBER : v);

  function render() {
    const v = `${(-x).toFixed(2)}px`;
    if (v !== written) { written = v; clip.style.setProperty("--udr-offset", `${x.toFixed(2)}px`); }
    root.toggleAttribute("data-udr-scrolled", x > 1);
    root.toggleAttribute("data-udr-more", x < max - 1);
  }

  function settleTo(/** @type {number} */ to, /** @type {number} */ now) {
    if (reduced.matches || Math.abs(to - x) < 0.5) { x = to; mode = "rest"; render(); return; }
    tw = { from: x, to, t0: now };
    mode = "settle";
    kick();
  }

  function tick(/** @type {number} */ now) {
    raf = 0;
    if (mode === "glide") {
      const t = now - glide.t0;
      const k = Math.exp(-t / CONFIG.TAU);
      x = glide.from + glide.v * CONFIG.TAU * (1 - k);
      if (x < -pitch * 0.15 || x > max + pitch * 0.15 || Math.abs(glide.v * k) < CONFIG.REST_SPEED) settleTo(snap(x), now);
    } else if (mode === "settle") {
      const p = Math.min(1, (now - tw.t0) / CONFIG.SETTLE_MS);
      x = tw.from + (tw.to - tw.from) * easeInOut(p);
      if (p >= 1) mode = "rest";
    } else if (mode === "wheel" && now - wheelAt > CONFIG.WHEEL_IDLE) {
      settleTo(snap(x), now);
    }
    render();
    if (mode !== "rest" && mode !== "pending") kick();
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // ---------- pointer ----------
  /** @param {PointerEvent} e */
  function onDown(e) {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (mode === "glide" || mode === "settle") mode = "rest"; // grab the moving row
    g = { id: e.pointerId, x: e.clientX, y: e.clientY, start: x, samples: [{ t: e.timeStamp, x }] };
    mode = "pending";
  }
  /** @param {PointerEvent} e */
  function onMove(e) {
    if (!g || e.pointerId !== g.id) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (mode === "pending") {
      if (Math.abs(dx) < CONFIG.DRAG_START && Math.abs(dy) < CONFIG.DRAG_START) return;
      if (Math.abs(dy) >= Math.abs(dx)) { g = null; mode = "rest"; return; } // vertical: not ours
      mode = "drag";
      root.setAttribute("data-udr-dragging", "");
      try { root.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      opts.onMove?.();
    }
    if (mode !== "drag") return;
    x = rubber(g.start - dx);
    g.samples.push({ t: e.timeStamp, x });
    while (g.samples.length > 2 && e.timeStamp - g.samples[0].t > CONFIG.VELOCITY_WINDOW) g.samples.shift();
    render();
  }
  /** @param {PointerEvent} e */
  function onUp(e) {
    if (!g || e.pointerId !== g.id) return;
    const was = mode;
    const s = g.samples;
    g = null;
    root.removeAttribute("data-udr-dragging");
    if (was !== "drag") { mode = "rest"; return; }
    dragEndedAt = performance.now();
    const a = s[0], b = s[s.length - 1];
    const v = b.t > a.t ? Math.max(-CONFIG.MAX_SPEED, Math.min(CONFIG.MAX_SPEED, (b.x - a.x) / (b.t - a.t))) : 0;
    if (reduced.matches) { settleTo(snap(x), performance.now()); return; }
    glide = { from: x, v, t0: performance.now() };
    mode = "glide";
    kick();
  }
  /** a click right after a drag belongs to the drag (no open) @param {MouseEvent} e */
  function onClick(e) {
    if (performance.now() - dragEndedAt < 250) { e.stopPropagation(); e.preventDefault(); }
  }

  // ---------- trackpad / wheel ----------
  /** @param {WheelEvent} e */
  function onWheel(e) {
    let dx = e.deltaX;
    if (!dx && e.shiftKey) dx = e.deltaY; // Shift + mouse wheel
    if (!dx || Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return; // vertical: the page scrolls
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? root.clientWidth : 1;
    if (mode !== "wheel") opts.onMove?.();
    mode = "wheel";
    wheelAt = performance.now();
    x = Math.max(-pitch * 0.15, Math.min(max + pitch * 0.15, x + dx * unit));
    render();
    kick();
  }

  // ---------- keys ----------
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const base = mode === "settle" ? tw.to : snap(x);
    settleTo(snap(base + (e.key === "ArrowRight" ? pitch : -pitch)), performance.now());
  }

  /** bring garment i fully into view (the focus view shows it; it flies back there on close) */
  function reveal(/** @type {number} */ i) {
    measure();
    const full = Math.max(1, Math.floor(span / pitch) - 1); // garments fully between the brackets
    const at = i * pitch;
    let to = x;
    if (at < x) to = at;
    else if (at > x + (full - 1) * pitch) to = at - (full - 1) * pitch;
    x = snap(to);
    mode = "rest";
    render();
  }

  const onResize = () => { measure(); x = snap(x); render(); };
  const ro = new ResizeObserver(onResize);
  ro.observe(root);
  onResize();

  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onUp);
  root.addEventListener("click", onClick, true);
  root.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("keydown", onKey);

  return {
    offset: () => x,
    isDragging: () => mode === "drag" || mode === "wheel" || mode === "glide",
    justDragged: () => performance.now() - dragEndedAt < 250,
    reveal,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      root.removeEventListener("click", onClick, true);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
    },
  };
}
