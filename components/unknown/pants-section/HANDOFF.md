# UNKNOWN pants section: handoff

A pinned, scroll-scrubbed showcase directly under the rack hero on `/unknown`. The section rises
over the held hero through a soft cloud edge; then the stage stays put and the pants on the model
change one pair at a time. Page-level
notes (tokens, fonts, other sections, deploy) are in `components/unknown/HANDOFF.md`.

## Files

| File | What it is | In Shopify |
|---|---|---|
| `pants.data.ts` | Pants list (order, store name, display name, price, link, colour + grey image), label, base image, intro copy, cloud images | Product blocks + section settings |
| `PantsSection.tsx` | Markup only; calls `initPantsSection()` | `sections/unknown-pants.liquid` |
| `pants-section-behaviour.js` | All behaviour, plain JS, no libraries | `assets/unknown-pants.js`, copy as is |
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
<handle>-grey.webp                  greyscale copy of each pair (the ghost), made by the same script
```

Every model image has a short soft fade baked into its top edge (the crop starts at the waist):
a smoothstep over the top 5.7% of the image, so the fade's 10-90% span is **3.9% of the model's
visible height**, measured to match the reference (`reference/unknown/MOTION.md`, "v3"). The body
is fully opaque below it. The waist mist sits **behind** the model (atmosphere only, it never
veils the body).

Atmosphere: `public/products/unknown/atmosphere/` (pre-rendered transparent WebP, made by
`scripts/generate-unknown-clouds.py`): `clouds-back.webp` 1600×700 (17 KB), `clouds-front.webp`
1600×500 (14 KB), `mist.webp` 1600×360 (11 KB). No live blur anywhere.

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
  grey: string;     // the matching -grey.webp
  hidden?: boolean; // left out until its image exists
};
```

## Markup contract (what the JS looks for)

```
div.unk-hold                           wraps the hero and this section
  div.unk-hold__hero                   the hero, position: sticky (held while the section rises over it)
  section.unk-pants  style="--unk-pants-count: N+1"   (N pairs + the base state)
    .unk-pants__feather                30vh soft edge above the section, with the mist image; JS fades
                                       it in over the first 8% of the rise (hidden at rest on the hero)
    [data-pants-stage]                 the pinned screen (sky gradient)
      .unk-pants__sky > img[data-cloud="back"], img[data-cloud="front"]
      .unk-pants__figure               one 3:4 frame holding, in order:
        img[data-pants-layer]          state 0: model in the base pants (opacity 1)
        img[data-pants-layer] × N      each pair in colour
        img[data-pants-grey] × N       greyscale copies: the ghost at the right / sliding in
      div[data-cloud="mist"]           mist around the crop line, behind the figure (CSS background)
      button[data-pants-peek]          invisible box where the ghost rests (clickable: next pair)
      article[data-pants-item]         state 0 intro ("4 pairs" / "Scroll to try each one on")
      article[data-pants-item] × N     [data-pants-name] (plain text, split into lines by JS),
                                       [data-pants-fade] price + View product link, [data-pants-buy] bar
      [data-pants-current] [data-pants-progress] [data-pants-prev] [data-pants-next] [data-pants-status]
(no tail element: the next section's top padding carries the fade from the sky into white,
 see "Release" below)
```

## Motion, in plain English

Measured first; numbers in `reference/unknown/MOTION.md` (v2 table).

- **Entry:** the hero is held (`position: sticky`) and the section scrolls up over it. Its top
  edge is a 30vh feather (clear → sky) with a mist band, so there is never a hard line. Two cloud
  layers rise a little slower than the section (depth) and drift sideways with progress at two
  speeds; the waist mist drifts the other way. All by `transform`.
- **Pinning** is CSS: the stage is `position: sticky`. The section is `112svh + (states - 1.2) x
  94svh` tall: a 0.12-screen lead-in on the first state, then 0.94 of a screen per state, ending
  exactly where the last pair has settled (so it **releases immediately**, no dead scroll). The
  same numbers are `LEAD` / `STEP` in `pants-section-behaviour.js`; keep them in step.
- **Release:** the buy bar sits `--pants-inset` above the stage's bottom (32px, 16px on phones /
  tall screens); the next section's top padding is the section gap minus that inset (64 / 48 / 80,
  all on the scale), so the visible gap from the buy bar to New Arrivals is exactly the section gap
  (96 expanded, 64 compact), and that padding fades from the sky colour into white.
- **Rest state 0:** the model in the neutral base pants, the first pair waiting at the right as a
  faint grey ghost (opacity `--peek-opacity`, 0.2).
- **One loop:** a single `requestAnimationFrame` loop. Scroll position becomes a progress value
  `u` (0 = base, 1 = first pair …), smoothed with a lerp (time constant 0.1 s). The loop only runs
  while something is moving, writes only `transform` and `opacity` (cached, so unchanged values are
  never re-written), and reads layout on resize only.
- **Holds and swaps:** each state holds still for the first and last 20% of its screen of scroll;
  the middle 60% scrubs the swap (follows the scroll, plays backwards going up):

  | Phase (share of the swap) | What happens |
  |---|---|
  | 5–80% | the ghost (grey + colour copies together) slides left onto the body, ease-out, still faint |
  | 50–85% | it turns solid: grey copy fades out, colour copy fades in |
  | 70–95% | only then the outgoing pair fades (short overlap: the body is never see-through, no double arms at rest) |
  | 40–100% | the outgoing pair drifts 2% of the frame width to the LEFT |
  | 35–100% | the next pair's ghost slides in from beyond the right edge to the ghost spot |
  | 15–45% (+6% per line) | old name rolls up and out, line by line |
  | 50–80% (+6% per line) | new name rolls up into place |
  | 15–40% / 55–85% | price, link and buy bar fade out / in |

- **No resting mid-swap:** if scrolling stops for 160 ms inside a swap, the picture eases to the
  nearest state on its own. The page itself is never moved (no snapping).
- **First visit:** after load, the images the entry shows first are decoded (`img.decode()`),
  then (only if the visitor is still at the top) the stage is drawn once off-screen-invisible
  (opacity 0.001) at three entry positions so the browser's one-time drawing work happens before
  the first scroll; then the remaining pairs are decoded. All model images load eagerly.
- **Reduced motion:** pairs, ghost and text cross-fade in place; clouds stay still; arrows jump.
- **Performance:** no CSS filters, masks or live blur on anything that moves; greys, the top fade
  and the clouds are baked into image files. Measured with 60 fps screen recordings on a machine
  without a GPU (harsher than real phones): fresh-load desktop pass 1 of 1017 frames over 20 ms
  (33 ms), phone-sized window 0 of 1196; entry-only passes 1 of ~1160 frames over 20 ms.
- **Overflow:** the mist bands are wider than the screen; `overflow-x: clip` on the section keeps
  the page from scrolling sideways on phones (use `clip`, not `hidden`, or sticky breaks).

## Type and colour

Hanken Grotesk on M3 roles: label Label Small, product name Headline Large (32/40), price Body
Large, intro line Body Medium, counter and buy-bar name Label Medium, Add to cart Label Large.
Sky (re-tuned for the white hero): `#F0F3F6` → `#F8FAFB`, ink 16.4:1, mute 6.0:1 (AA). Loading the
font in Shopify: see the page-level HANDOFF.

## Accessibility

Real `<h2>` (the "PANTS" label) and `<h3>` names; only the active pair is focusable (`inert` +
`aria-hidden` on the others, switched at the halfway point of a swap); polite live region
announces "2 of 4: NAME, PRICE"; the counter shows "—" on the intro state; 48px targets; arrows use `aria-disabled` so focus is never lost;
model images are decorative (`alt=""`) because the name is announced.

## Shopify version

- **Section settings:** `label` (text, default "PANTS"), `base_image` (image_picker),
  `intro_meta` (text, "Scroll to try each one on"; the intro title is "{{ section.blocks.size }} pairs").
  Cloud images ship as theme assets (`asset_url`), not settings.
- **Blocks:** type `pair`, limit 8, settings `product` (product picker), `model_image`
  (image_picker: that pair worn by the model, already cut out and aligned), `grey_image`
  (image_picker: the matching `-grey.webp` from the image script) and an optional `display_name`
  text (title case; defaults to the product title). Name, price and URL come from the product.
  If a merchant ever skips the grey image, fall back to the colour image with CSS
  `filter: grayscale(1)` (works, but costs frames on low-end devices).
- **Markup:** loop the blocks for the layers, again for the grey copies, again for the articles;
  `block.shopify_attributes` on each article; `style="--unk-pants-count: {{ section.blocks.size | plus: 1 }}"`. The buy bar shows thumbnail,
  name and Add to cart only (the price is shown once, under the name on the left).
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
- **Held hero:** in the theme the hero and pants are two sections, so wrap neither; instead give
  the hero section `position: sticky; top: 0` and the pants section a higher `z-index` and
  `position: relative` (same effect as `.unk-hold`). Give the next section the
  `.unk-hold + .unk-section` padding / fade rule (in the theme: a class on that section).
- **CSS:** drop the `body:has()` rule (a theme page scrolls normally); no ancestor of the section
  may have `overflow: hidden/auto` (it would break `position: sticky`).
- **Still to decide:** real add to cart needs a size choice (or quick-add drawer) before posting
  to `/cart/add`; sold-out and compare-at states.
