// @ts-check
/**
 * UNKNOWN reveal: elements marked [data-reveal] fade up 16px once, the first time they scroll
 * into view (IntersectionObserver; no scroll listeners). The hidden starting state only applies
 * once this script has run (it adds .unk-reveal-on), so content is never lost without JS.
 * Reduced motion: CSS drops the movement and keeps a short fade.
 * In the theme: load once from the layout and call initReveal(document.body).
 * @param {HTMLElement} root
 */
export function initReveal(root) {
  const els = /** @type {HTMLElement[]} */ ([...root.querySelectorAll("[data-reveal]")]);
  if (!("IntersectionObserver" in window) || !els.length) return () => {};
  root.classList.add("unk-reveal-on");
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
  );
  els.forEach((el) => io.observe(el));
  return () => io.disconnect();
}
