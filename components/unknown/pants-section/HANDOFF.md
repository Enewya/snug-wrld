# UNKNOWN pants section: handoff

A pinned, scroll-scrubbed showcase directly under the rack hero on `/unknown`. As the visitor
scrolls, the stage stays put and the pants on the model change one pair at a time. Page-level
notes (tokens, fonts, other sections, deploy) are in `components/unknown/HANDOFF.md`.

## Files

| File | What it is | In Shopify |
|---|---|---|
| `pants.data.ts` | Pants list (order, store name, display name, price, link, image), label, base image | Product blocks + section settings |
| `PantsSection.tsx` | Markup only; calls `initPantsSection()` | `sections/unknown-pants.liquid` |
| `pants-section.js` | All behaviour, plain JS, no libraries | `assets/unknown-pants.js`, copy as is |
| `pants-section.css` | All styles, scoped under `.unk-pants`, values from `../tokens.css` | `assets/unknown-pants.css` (drop the first `body:has()` rule) |

Motion reference and measured timings: `reference/unknown/MOTION.md` (videos in the same folder).

## Images

`public/products/unknown/pants/`, 3:4 (1086 × 1448) WebP under 200 KB, transparent background,
one model, aligned to `model-base.webp` by **body** (torso width for scale, shoe soles for
height, torso centre for x), never by garment width. All layers sit in **one fixed 3:4 frame**
with identical `object-fit: contain; object-position: 50% 100%`; there are no per-product sizes
anywhere in the CSS.

```
model-base.webp                     grey chinos: the neutral in-between state, not a product
unknown-denim-jean.webp             olive washed denim
unknown-side-eye-baggy-pant.webp    grey wide sweatpant
unknown-logo-sweatpant-brown.webp   brown logo sweatpant
unknown-lgt-strikes-joggers.webp    cream lightning-crack jogger
unknown-logo-sweatpant-red.webp     not supplied yet: red is switched off (`hidden`) in pants.data.ts
```

Pipeline: `scripts/prepare-unknown-pants.py` (cut-out, align, common crop), then
`scripts/optimize-unknown-pants.mjs` (WebP). Details: `assets/products-src/unknown/pants/PROCESSING.md`.
Known issue: brown and cream have the arms at a different angle, so a second pair of hands shows
for a moment mid-swap (never at rest); regeneration prompt in the page-level HANDOFF.

## Data shape

```ts
type PantsItem = {
  handle: string;   // Shopify handle, also the image file name
  name: string;     // exact store name (uppercase), used in the buy bar and for screen readers
  display: string;  // same name in title case for the big type ("LGT" stays uppercase)
  price: string;    // formatted, e.g. "₦145,000"
  url: string;      // product page; "Add to cart" links here for now
  image: string;
  hidden?: boolean; // left out until its image exists
};
```

## Markup contract (what the JS looks for)

```
section.unk-pants  style="--unk-pants-count: N"   (optional data-under="<selector>", see Motion)
  [data-pants-stage]                   the pinned screen
    .unk-pants__figure                 one 3:4 frame holding, in order:
      img[data-pants-base]             model in neutral pants (opacity 0)
      img[data-pants-layer] × N        each pair in colour
      img[data-pants-grey] × N         greyscale copies (<handle>-grey.webp): peek at rest, ghost mid-swap
    button[data-pants-peek]            invisible box marking where the peek rests (also clickable)
    article[data-pants-item] × N       name ([data-pants-name]: plain text, split into lines by JS),
                                       [data-pants-fade] price + link, [data-pants-buy] buy bar
    [data-pants-current] [data-pants-progress] [data-pants-prev] [data-pants-next] [data-pants-status]
```

## Motion, in plain English

- **Pinning** is CSS: the section is N screens tall and the stage is `position: sticky`.
- **Entry from the hero:** the section has a higher z-index and scrolls up over the hero with a
  soft shadow on its top edge; it pins the moment its top reaches the top of the screen (as in the
  reference). The reference also shows the hero drifting up at ~0.75× underneath. That parallax is
  built in but **off by default**: add `data-under="<hero selector>"` to the section to turn it on.
  In 60 fps testing without GPU compositing it caused 20–30% dropped frames during the entry
  (0–14 long frames of ~150 with it off vs 32–44 with it on), so smoothness won.
- **One loop:** a single `requestAnimationFrame` loop. Scroll position becomes a progress value
  `u` (0 = first pair … N-1 = last), smoothed with a lerp (time constant 0.1 s). The loop only runs
  while something is moving, writes only `transform` and `opacity`, and only when a value changes.
  Layout is read on resize only.
- **Holds and swaps:** within each pair's screen of scroll, the first and last 20% hold still and
  the middle 60% scrubs the swap (it follows the scroll and plays backwards going up):

  | Phase (share of the swap) | What happens |
  |---|---|
  | 0–30% | outgoing pair fades (ease-in-out: slow start as measured, soft finish) and drops 12px |
  | 0–25% / 25–70% / 70–100% | base model fades in / holds / fades out (never visible at rest) |
  | 25–85% | the next pair (grey + colour copies together) slides from the peek onto the model (ease-out) |
  | 60–100% | ghost turns solid: grey copy fades out, colour copy fades in |
  | 35–100% | the pair after that slides in from beyond the right edge to the peek spot |
  | 15–45% (+6% per line) | old name rolls up and out, line by line |
  | 50–80% (+6% per line) | new name rolls up into place, line by line |
  | 15–40% / 55–85% | price, link and buy bar fade out / in |

- **No resting mid-swap:** if scrolling stops for 160 ms inside a swap, the picture eases to the
  nearest pair on its own. The page itself is never moved, so nothing fights the user, and a fast
  flick lands exactly where the page stopped.
- **Reduced motion:** pairs, peek and text cross-fade in place; nothing moves; arrows jump.
- **Performance:** no `will-change` (tested: no difference), and no CSS filters or masks on the
  moving images. The greyscale peek copies and the soft top fade are baked into the image files,
  which took swaps from ~15% dropped frames to 0 in 60 fps testing without GPU compositing.

## Fonts

Product names use **Hanken Grotesk 500** (Google Fonts), the closest free match to the
reference's neo-grotesque (comparison: `reference/unknown/font-compare.png`). It is a close
match, not the same typeface. Loading in Shopify: see the page-level HANDOFF.

## Accessibility

Real `<h2>` (the "PANTS" label) and `<h3>` names; only the active pair is focusable (`inert` +
`aria-hidden` on the others, switched at the halfway point of a swap); polite live region
announces "2 of 4: NAME, PRICE"; 44px targets; arrows use `aria-disabled` so focus is never lost;
model images are decorative (`alt=""`) because the name is announced.

## Shopify version

- **Section settings:** `label` (text, default "PANTS"), `base_image` (image_picker).
- **Blocks:** type `pair`, limit 8, settings `product` (product picker), `model_image`
  (image_picker: that pair worn by the model, already cut out and aligned) and an optional
  `display_name` text (title case; defaults to the product title). Name, price and URL come from
  the product.
- **Markup:** loop the blocks for the layers, again for the grey copies, again for the articles;
  `block.shopify_attributes` on each article; `style="--unk-pants-count: {{ section.blocks.size }}"`.
  Images: `{{ block.settings.model_image | image_url: width: 1086 | image_tag: widths: '540, 800, 1086', sizes: '(max-width: 760px) 90vw, 45vh', alt: '' }}`.
- **JS:** wrap in a custom element so the theme editor's section reloads work automatically:
  ```js
  class UnknownPants extends HTMLElement {
    connectedCallback() { this.cleanup = initPantsSection(this.querySelector(".unk-pants")); }
    disconnectedCallback() { this.cleanup?.(); }
  }
  customElements.define("unknown-pants", UnknownPants);
  ```
  Optional: on `shopify:block:select`, scroll to that pair.
- **Parallax (optional):** `data-under` takes a selector for the section above (the hero
  section's id). Off by default; test on real devices before enabling.
- **CSS:** drop the `body:has()` rule (a theme page scrolls normally); no ancestor of the section
  may have `overflow: hidden/auto` (it would break `position: sticky`).
- **Still to decide:** real add to cart needs a size choice (or quick-add drawer) before posting
  to `/cart/add`; sold-out and compare-at states.
