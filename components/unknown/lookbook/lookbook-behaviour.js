// @ts-check
/**
 * UNKNOWN lookbook row: native horizontal scroll with snap (swipe / trackpad / shift-wheel), plus
 * prev/next buttons that move one look at a time. Button state follows the scroll position (one
 * rAF per scroll frame, reads only scrollLeft/scrollWidth). Reduced motion: buttons jump.
 * Photos are decoded ahead of time: when the section comes within two screens (from above or
 * below), each photo is loaded and decoded one after another in idle time, so none is decoded
 * on the frames it first appears (measured: that decode was the lag scrolling into the row).
 * @param {HTMLElement} root the .unk-lookbook section
 */
export function initLookbook(root) {
  const row = /** @type {HTMLElement} */ (root.querySelector("[data-look-row]"));
  const prev = /** @type {HTMLElement} */ (root.querySelector("[data-look-prev]"));
  const next = /** @type {HTMLElement} */ (root.querySelector("[data-look-next]"));
  if (!row || !prev || !next) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = row.scrollWidth - row.clientWidth - 2;
    prev.setAttribute("aria-disabled", String(row.scrollLeft <= 2));
    next.setAttribute("aria-disabled", String(row.scrollLeft >= max));
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  /** @param {number} dir */
  const step = (dir) => {
    const looks = /** @type {HTMLElement[]} */ ([...row.children]);
    const x = row.scrollLeft;
    // next / previous look whose left edge is past the current position
    const pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
    const lefts = looks.map((l) => l.offsetLeft - pad);
    const target = dir > 0 ? lefts.find((l) => l > x + 4) : [...lefts].reverse().find((l) => l < x - 4);
    if (target === undefined) return;
    row.scrollTo({ left: target, behavior: reduced.matches ? "auto" : "smooth" });
  };
  const onPrev = () => step(-1);
  const onNext = () => step(1);
  row.addEventListener("scroll", onScroll, { passive: true });
  prev.addEventListener("click", onPrev);
  next.addEventListener("click", onNext);
  window.addEventListener("resize", onScroll);
  update();

  const imgs = /** @type {HTMLImageElement[]} */ ([...row.querySelectorAll("img")]);
  let alive = true;
  const idle = (/** @type {() => void} */ f) => ("requestIdleCallback" in window ? window.requestIdleCallback(f, { timeout: 500 }) : setTimeout(f, 50));
  const decodeNext = (/** @type {number} */ i) => {
    if (!alive || i >= imgs.length) return;
    const img = imgs[i];
    img.loading = "eager";
    (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => idle(() => decodeNext(i + 1)));
  };
  const near = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near?.disconnect();
      idle(() => decodeNext(0));
    }, { rootMargin: "200% 0px" })
    : null;
  if (near) near.observe(root);

  return () => {
    alive = false;
    near?.disconnect();
    cancelAnimationFrame(raf);
    row.removeEventListener("scroll", onScroll);
    prev.removeEventListener("click", onPrev);
    next.removeEventListener("click", onNext);
    window.removeEventListener("resize", onScroll);
  };
}
