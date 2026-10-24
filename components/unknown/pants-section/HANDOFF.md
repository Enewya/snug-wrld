# UNKNOWN pants section: handoff

A pinned, scroll-driven showcase that sits directly under the rack hero on `/unknown`. As the
visitor scrolls, the page stays still and the pants on the model change one pair at a time.
This is a visual prototype, written so it can be ported to a Shopify section.

## Files

All in `components/unknown/pants-section/`:

| File | What it is | In Shopify |
|---|---|---|
| `pants.data.ts` | The list of pants (order, name, price, link, image) plus the label and base image | Product blocks + section settings |
| `PantsSection.tsx` | Markup only. Renders the HTML, then calls `initPantsSection()` | `sections/unknown-pants.liquid` |
| `pants-section.js` | All behaviour: plain JS, no libraries | `assets/unknown-pants.js`, copy as is |
| `pants-section.css` | All styles, scoped under `.unk-pants` | `assets/unknown-pants.css`, copy as is (drop the `body:has()` rule, see below) |

Wiring: `app/unknown/page.tsx` renders `<UnknownShowroom />` then `<PantsSection />`.

## Images

Served from `public/products/unknown/pants/`: 3:4 portraits (1086 × 1448 WebP, under 200 KB),
**transparent background**, one model in one pose, aligned so every pair sits on the same body in
the same place (the swap only looks right if they line up):

```
model-base.webp                     grey chinos: the neutral in-between state, not a product
unknown-denim-jean.webp             olive washed denim
unknown-side-eye-baggy-pant.webp    grey wide sweatpant
unknown-logo-sweatpant-brown.webp   brown logo sweatpant
unknown-lgt-strikes-joggers.webp    cream lightning-crack jogger
unknown-logo-sweatpant-red.webp     not supplied yet: the red pair is switched off (`hidden`) in pants.data.ts
```

They are made from the generated photos (white background) in `assets/products-src/unknown/pants/`
by two scripts: `scripts/prepare-unknown-pants.py` (cut-out, align to the base by torso width and
shoe soles, common crop) then `scripts/optimize-unknown-pants.mjs` (WebP, same settings as
`scripts/optimize-images.mjs`). To replace a photo, drop the new one in under the same name and
run both. Details and the last alignment report: `assets/products-src/unknown/pants/PROCESSING.md`.

**Known issue:** the brown and cream photos have the arms at a different angle from the base, so
for about half a second mid-swap a second pair of hands is visible. At rest it is clean. Both
photos are being regenerated in the exact base pose.

For Shopify, upload the served WebPs (already cut out and aligned), not the originals.

## Data shape

```ts
type PantsItem = {
  handle: string; // Shopify handle, also the image file name
  name: string;
  price: string;  // already formatted, e.g. "₦145,000"
  url: string;    // product page; "Add to cart" links here for now
  image: string;  // the pair worn by the model
  hidden?: boolean; // left out until its image exists (red, for now)
};
// plus PANTS_LABEL ("PANTS") and PANTS_BASE_IMAGE. The section renders `pants` (hidden ones removed).
```

## Markup contract (what the JS looks for)

```
section.unk-pants  style="--unk-pants-count: N"
  [data-pants-stage]            the pinned screen
    [data-pants-figure]         img[data-pants-base] (opacity 0), then one img[data-pants-layer] per pair (in order)
    [data-pants-peek-box]       one img[data-pants-peek] per pair (in order)
    article[data-pants-item]    one per pair (first has .is-active; others aria-hidden + inert)
      [data-pants-roll]         each word of the name, wrapped in span.unk-pants__word
      [data-pants-fade]         price and "View product"
      [data-pants-buy]          the buy bar (.unk-pants__buy-name / .unk-pants__buy-price read for screen readers)
    [data-pants-current] [data-pants-progress] [data-pants-prev] [data-pants-next] [data-pants-status]
```

## Scroll technique and animation, in plain English

- **Pinning is plain CSS.** The section is N screens tall (`--unk-pants-count × 100svh`). Inside
  it, the stage is `position: sticky; top: 0; height: 100svh`, so it stays on screen while the
  page scrolls through the section, then scrolls away at the end. No JS is involved.
- **Picking the pair.** On scroll (throttled to once per frame), the JS works out how far
  through the section the visitor is (0–1) and splits that into N equal steps. Each step is one
  pair. The thin line next to `01 / 05` follows the exact scroll position.
- **The swap is triggered, not scrubbed.** Crossing into a new step plays one timed swap
  (about 1 second), the same at any scroll speed:
  1. The outgoing pants fade out and drop 16px while the base model fades in under them. The base
     is only shown during a swap and fades away once the new pair has landed, so its arms never
     show next to a pair whose pose differs slightly.
  2. The faint grey peek at the right edge becomes the incoming pair. It glides onto the model
     while still see-through (the brief ghosted overlap), turns solid as it lands, and the next
     peek fades in at the edge.
  3. The name rolls up word by word (old out, new in), and the price, link, buy bar and counter
     cross-fade. Scrolling back plays it in reverse.
- **No jumps.** Every animation starts from wherever the element is at that moment, so fast
  or reversed scrolling can't make anything snap.
- **Reduced motion** (`prefers-reduced-motion: reduce`): the pants cross-fade in place, and the
  text fades out then in. Nothing slides or rolls, and the arrows jump instead of smooth-scrolling.
- **Why no GSAP / ScrollTrigger:** the pinning is native CSS, and the swaps are a handful of
  opacity and transform tweens. The browser's built-in `element.animate()` (Web Animations API)
  covers that, so the theme needs no library and no licence.
- **Why not CSS scroll-driven animations:** they tie an animation's progress to the scroll
  position. This design plays a timed swap once a scroll point is crossed, and support on older
  iPhones is still patchy.
- **Timings** are all in one object `T` at the top of `pants-section.js`.
- The top of the model image fades out (a CSS mask on the figure, and a deeper one on the peek), so
  the torso never ends in a hard line, as in the reference.

## Accessibility

- Real `<h2>` (the "PANTS" label) and an `<h3>` per product name. Only the active pair is in
  the tab order: the others are `inert` and `aria-hidden`.
- The previous/next arrows are 44px buttons. They scroll the page to that pair, so scroll position
  always decides what is shown. At the ends they use `aria-disabled`, not `disabled`, so keyboard
  focus is never lost.
- A polite live region announces "2 of 5: NAME, PRICE" on each change.
- Model images are decorative (`alt=""`) because the product name is announced. Visible focus
  rings on every control, and touch targets of at least 44px.

## Responsive

- **Desktop:** name on the left (its column stops short of the pants), model centred, peek on the
  right, progress and arrows bottom-left, buy bar bottom-centre. Below 1180px wide the name drops
  out of the buy bar.
- **Phones and tall screens** (`max-width: 760px` or taller than 5:4): label and name across the
  top (room is reserved for three lines, so they never cover the pants), model in the middle, then
  the progress/arrows row, then a full-width row with the price and "Add to cart". Heights use
  `svh`, so mobile browser bars don't make the layout jump.

## Porting to Shopify

**Section schema (`sections/unknown-pants.liquid`):**
- Settings: `label` (text, default "PANTS"), `base_image` (image_picker).
- Blocks: type `pants`, limit around 8. Settings: `product` (product picker) and `model_image`
  (image_picker: that pair worn by the model). Name, price and URL come from the product, so
  nothing is typed twice.
- Add a `presets` entry so the section can be added from the theme editor.

Hidden pairs need no setting in Shopify: just don't add a block for the red pair until its image exists.

**Markup:** loop `section.blocks` twice (layers + peeks), then once more for the articles,
following the contract above. Use `block.shopify_attributes` on each article. Suggested image tag:
`{{ block.settings.model_image | image_url: width: 1086 | image_tag: widths: '540, 800, 1086', sizes: '(max-width: 760px) 90vw, 45vh', alt: '' }}`.
Price: `{{ product.price | money }}`. Set `style="--unk-pants-count: {{ section.blocks.size }}"`.

**Loading the JS:** `pants-section.js` exports `initPantsSection(sectionEl)`, which returns a
cleanup function. Either remove the `export` keyword and load it with
`<script src="{{ 'unknown-pants.js' | asset_url }}" defer></script>`, or wrap it in a tiny custom
element:

```js
class UnknownPants extends HTMLElement {
  connectedCallback() { this.cleanup = initPantsSection(this.querySelector(".unk-pants")); }
  disconnectedCallback() { this.cleanup?.(); }
}
customElements.define("unknown-pants", UnknownPants);
```

**Theme editor reload support:** the custom element above handles it automatically, because the
editor replaces the section's HTML on every change, so it disconnects and reconnects. Without
it, listen to `shopify:section:load` (init) and `shopify:section:unload` (cleanup) for this
section's id. Optional: on `shopify:block:select`, scroll to that pair so the merchant sees the
block they clicked.

**CSS:** copy as is, except the first rule (`body:has(.unk-pants)`). It only exists because the
Snug Wrld prototype locks page scrolling. A Shopify page scrolls normally. Also check that no
ancestor of the section in the theme has `overflow: hidden/auto`, because that breaks
`position: sticky`.

**Still to decide for production:**
- **Real add to cart.** Pants have sizes, so the buy bar needs a size choice (or a quick-add
  drawer) before it can post to `/cart/add`. For now "Add to cart" links to the product page.
- Sold-out state (`product.available`) and compare-at prices.
- The theme's own header: in the prototype the hero header scrolls away with the hero.
