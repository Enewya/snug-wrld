// @ts-check
/**
 * UNKNOWN drop band: the big title drifts sideways as the band crosses the screen (opposite
 * directions for the two lines). One rAF per scroll frame, transform only, and only while the
 * band is on screen (IntersectionObserver). Reduced motion: static.
 * @param {HTMLElement} root
 */
export function initDropBand(root) {
  const lines = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-drift]")]);
  if (!lines.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let top = 0;
  let h = 1;
  let raf = 0;
  let visible = false;
  const measure = () => {
    top = root.getBoundingClientRect().top + window.scrollY;
    h = root.offsetHeight;
  };
  const draw = () => {
    raf = 0;
    const vh = window.innerHeight;
    // -1 when the band enters at the bottom, +1 when it leaves at the top
    const p = Math.max(-1, Math.min(1, ((window.scrollY + vh - top) / (vh + h)) * 2 - 1));
    lines.forEach((el) => {
      el.style.transform = `translate3d(${(p * Number(el.dataset.drift)).toFixed(2)}vw, 0, 0)`;
    });
  };
  const onScroll = () => {
    if (visible && !raf) raf = requestAnimationFrame(draw);
  };
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) onScroll();
  });
  measure();
  draw();
  io.observe(root);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", measure);
  };
}
