// @ts-check
/**
 * UNKNOWN mobile rack: behaviour. Framework-free (the theme loads this same file). No libraries.
 *
 * In plain English:
 * - The rod never moves; only the row of garments (one element, the track) slides sideways.
 * - Drag: once a touch has moved 6px more sideways than up/down, the garments follow the finger
 *   1:1 (vertical swipes are left to the browser, so the page still scrolls: touch-action: pan-y).
 * - Release: the row glides on with the finger's speed and slows down exponentially (time
 *   constant TAU), aimed so that it comes to rest with a garment exactly in the centre.
 * - Ends: dragging past the first / last garment meets resistance (RUBBER) and springs back.
 * - Side / front: every garment shows its side view; the one at rest in the centre turns to its
 *   front view (and grows 12%, like the desktop hover) with the desktop rack's turn spring. It turns
 *   back to the side as soon as the row moves again.
 * - Tap the centred garment (or Enter / Space on it) to open the focus view; tap another garment
 *   to bring it to the centre. Left / right arrow keys move one garment.
 * - One requestAnimationFrame loop, only while something moves; it writes transform and opacity
 *   only (plus a z-index and the caption text when the centred garment changes). Layout is read on
 *   resize only.
 * - prefers-reduced-motion: dragging still works, the row snaps without gliding, the turn is
 *   instant and nothing sways.
 *
 * CONFIG holds every tunable value. NOT YET MEASURED: the reference reel for this rack did not
 * reach the build, so these are provisional and marked for re-tuning against it (HANDOFF.md).
 */
const CONFIG = {
  TAU: 325, // ms, glide decay time constant (provisional: common kinetic-scroll value)
  RUBBER: 0.35, // share of the finger's travel applied past either end (provisional)
  DRAG_START: 6, // px of movement before a gesture counts as a drag
  VELOCITY_WINDOW: 100, // ms of pointer history used for the release speed
  CENTRE_SCALE: 1.12, // front view scale in the centre (= desktop hover, = focus view start)
  TURN_K: 120, // turn spring stiffness (desktop rack, lib/useHangerSpring.ts)
  TURN_C: 14, // turn spring damping (desktop rack)
};

/** @typedef {{ x: number, y: number, iw: number, rod: number, hovered: boolean }} Origin */
/** @typedef {{ origin: (i: number) => Origin | null, jumpTo: (i: number) => void, destroy: () => void }} MobileRackApi */

/**
 * @param {HTMLElement} root the `.umr` element
 * @param {{ onSelect: (index: number, origin: Origin) => void }} opts
 * @returns {MobileRackApi}
 */
export function initMobileRack(root, { onSelect }) {
  const track = /** @type {HTMLElement} */ (root.querySelector("[data-umr-track]"));
  const items = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-umr-item]")]);
  const cards = items.map((it) => /** @type {HTMLElement} */ (it.querySelector("[data-umr-card]")));
  const sides = items.map((it) => /** @type {HTMLElement} */ (it.querySelector("[data-umr-side]")));
  const fronts = items.map((it) => /** @type {HTMLElement} */ (it.querySelector("[data-umr-front]")));
  const hits = items.map((it) => /** @type {HTMLButtonElement} */ (it.querySelector("[data-umr-hit]")));
  const caption = root.querySelector("[data-umr-caption]");
  const n = items.length;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!n || !track) return { origin: () => null, jumpTo: () => {}, destroy: () => {} };

  // ---------- state ----------
  let pitch = 1; // px between hangers (read on resize)
  let iw = 1; // rendered photo width, px
  let rod = 1;
  let pos = 0; // continuous index of the garment in the centre (0 … n-1, past the ends while dragging)
  let mode = "rest"; // rest | pending | drag | glide
  /** @type {{ id: number, x: number, y: number, pos: number, samples: { t: number, pos: number }[] } | null} */
  let gesture = null;
  let glide = { from: 0, to: 0, t0: 0 };
  let centre = 0;
  let suppressClick = false;
  const angle = new Float32Array(n); // 0 = side facing us, 180 = front facing us
  const vel = new Float32Array(n);
  let raf = 0;
  let last = 0;

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
    const a = items[0].getBoundingClientRect();
    const b = items[1]?.getBoundingClientRect();
    pitch = b ? b.left - a.left : window.innerWidth / 3;
    const cs = getComputedStyle(root);
    iw = parseFloat(cs.getPropertyValue("--umr-iw-px")) || window.innerWidth * 0.58;
    rod = parseFloat(getComputedStyle(/** @type {HTMLElement} */ (root.querySelector(".umr__rail"))).height) || 6;
  }

  function render() {
    write(track, "transform", `translate3d(${(-pos * pitch).toFixed(2)}px, 0, 0)`);
    for (let i = 0; i < n; i++) {
      const a = angle[i];
      const turn = a <= 90 ? a : a - 180;
      const s = 1 + (CONFIG.CENTRE_SCALE - 1) * (a / 180);
      write(cards[i], "transform", `rotateY(${turn.toFixed(2)}deg) scale(${s.toFixed(4)})`);
      write(sides[i], "opacity", a <= 90 ? "1" : "0");
      write(fronts[i], "opacity", a <= 90 ? "0" : "1");
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

  // ---------- the loop ----------
  /** @param {number} now */
  function tick(now) {
    const dt = last ? Math.min(0.032, (now - last) / 1000) : 1 / 60;
    last = now;
    let moving = mode === "drag" || mode === "pending";

    if (mode === "glide") {
      const k = Math.exp(-(now - glide.t0) / CONFIG.TAU);
      pos = glide.to + (glide.from - glide.to) * k;
      if (Math.abs(pos - glide.to) < 0.002) {
        pos = glide.to;
        mode = "rest";
      } else moving = true;
    }
    setCentre(Math.max(0, Math.min(n - 1, Math.round(pos))));

    // turn: the centred garment faces front only once the row is at rest on it
    const settled = mode === "rest";
    for (let i = 0; i < n; i++) {
      const target = settled && i === centre ? 180 : 0;
      if (reduced.matches) {
        angle[i] = target;
        vel[i] = 0;
        continue;
      }
      if (angle[i] === target && vel[i] === 0) continue;
      vel[i] += ((target - angle[i]) * CONFIG.TURN_K - vel[i] * CONFIG.TURN_C) * dt;
      angle[i] += vel[i] * dt;
      if (Math.abs(target - angle[i]) < 0.05 && Math.abs(vel[i]) < 0.5) {
        angle[i] = target;
        vel[i] = 0;
      } else moving = true;
    }

    render();
    raf = moving ? requestAnimationFrame(tick) : 0;
    if (!raf) last = 0;
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  /** Glide to garment i (snapped); instant with reduced motion. @param {number} i */
  function glideTo(i) {
    const to = Math.max(0, Math.min(n - 1, i));
    if (reduced.matches) {
      pos = to;
      mode = "rest";
    } else {
      glide = { from: pos, to, t0: performance.now() };
      mode = "glide";
    }
    kick();
  }

  // ---------- pointer ----------
  /** past the ends, the finger's travel only counts RUBBER of the way @param {number} p */
  const rubber = (p) => (p < 0 ? p * CONFIG.RUBBER : p > n - 1 ? n - 1 + (p - (n - 1)) * CONFIG.RUBBER : p);

  /** @param {PointerEvent} e */
  function onDown(e) {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    // grabbing a gliding row stops it where it is
    if (mode === "glide") mode = "rest";
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
      mode = "rest";
      kick();
      return; // a tap: handled by the button's click
    }
    suppressClick = true;
    const a = s[0];
    const b = s[s.length - 1];
    const v = b.t > a.t ? (b.pos - a.pos) / (b.t - a.t) : 0; // garments per ms
    glideTo(Math.round(pos + v * CONFIG.TAU));
  }
  /** @param {PointerEvent} e */
  function onCancel(e) {
    if (!gesture || e.pointerId !== gesture.id) return;
    gesture = null;
    glideTo(Math.round(pos));
  }

  /** @param {MouseEvent} e */
  function onClick(e) {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      return;
    }
    const hit = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest("[data-umr-hit]"));
    if (!hit) return;
    const i = Number(hit.dataset.index);
    if (i === centre && mode === "rest") {
      const o = origin(i);
      if (o) onSelect(i, o);
    } else glideTo(i);
  }
  /** @param {KeyboardEvent} e */
  function onKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = Math.max(0, Math.min(n - 1, centre + (e.key === "ArrowRight" ? 1 : -1)));
    glideTo(next);
    hits[next].focus({ preventScroll: true });
  }

  /** Where garment i hangs right now (for the focus view's flight). @param {number} i @returns {Origin | null} */
  function origin(i) {
    const it = items[i];
    if (!it) return null;
    const r = it.getBoundingClientRect();
    return { x: r.left, y: r.top, iw, rod, hovered: i === centre && angle[i] > 90 };
  }
  /** Put garment i in the centre, facing front, at once (used while the focus view covers the rack). */
  function jumpTo(/** @type {number} */ i) {
    pos = Math.max(0, Math.min(n - 1, i));
    mode = "rest";
    setCentre(pos);
    for (let k = 0; k < n; k++) {
      angle[k] = k === pos ? 180 : 0;
      vel[k] = 0;
    }
    render();
  }

  const onResize = () => {
    measure();
    render();
  };

  // first paint: the first garment centred and facing front (no turn on load)
  measure();
  items.forEach((it, i) => (it.style.zIndex = String(i === 0 ? 3 : 1)));
  angle[0] = 180;
  render();

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
    destroy() {
      cancelAnimationFrame(raf);
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
