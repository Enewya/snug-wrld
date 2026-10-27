// @ts-check
/**
 * Slides section: behaviour. Framework-free (the theme loads this same file). No libraries.
 * - Pair / Strap: the chosen view fades in over the other (M3 crossfade: 300ms, emphasized
 *   decelerate in / accelerate out); aria-pressed on the buttons, aria-hidden on the hidden photo.
 * - Tilt: on hover devices only, the panel's photo leans up to 3deg toward the pointer (transform
 *   only, one rAF per move, eased back on leave). Off for prefers-reduced-motion.
 * @param {HTMLElement} root the `.unk-slides` section
 * @returns {() => void} cleanup
 */
export function initSlides(root) {
  const opts = /** @type {HTMLButtonElement[]} */ ([...root.querySelectorAll("[data-slides-opt]")]);
  const views = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-slides-view]")]);
  const panel = /** @type {HTMLElement | null} */ (root.querySelector("[data-slides-panel]"));
  const tilt = /** @type {HTMLElement | null} */ (root.querySelector("[data-slides-tilt]"));
  const MAX = 3; // deg

  /** @param {Event} e */
  const onOpt = (e) => {
    const i = Number(/** @type {HTMLElement} */ (e.currentTarget).dataset.slidesOpt);
    opts.forEach((b, k) => b.setAttribute("aria-pressed", String(k === i)));
    views.forEach((v, k) => {
      v.toggleAttribute("data-on", k === i);
      v.setAttribute("aria-hidden", String(k !== i));
    });
  };
  opts.forEach((b) => b.addEventListener("click", onOpt));

  const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  /** @param {PointerEvent} e */
  const onMove = (e) => {
    if (!panel || !tilt) return;
    const r = panel.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => { tilt.style.transform = `perspective(1200px) rotateX(${(-y * 2 * MAX).toFixed(2)}deg) rotateY(${(x * 2 * MAX).toFixed(2)}deg)`; });
  };
  const onLeave = () => { cancelAnimationFrame(raf); if (tilt) tilt.style.transform = ""; };
  if (canTilt && panel) {
    panel.addEventListener("pointermove", onMove);
    panel.addEventListener("pointerleave", onLeave);
  }
  return () => {
    cancelAnimationFrame(raf);
    opts.forEach((b) => b.removeEventListener("click", onOpt));
    panel?.removeEventListener("pointermove", onMove);
    panel?.removeEventListener("pointerleave", onLeave);
  };
}
