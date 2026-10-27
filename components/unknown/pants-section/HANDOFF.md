# UNKNOWN pants section: handoff

A pinned, scroll-scrubbed showcase directly under the rack hero on `/unknown`. The section rises
over the held hero through a soft cloud edge; then the stage stays put and the pants on the model
change one pair at a time. **The model never moves: only the pants do.** Page-level notes (tokens,
fonts, other sections, deploy) are in `components/unknown/HANDOFF.md`.

## Files

| File | What it is | In Shopify |
|---|---|---|
| `pants.data.ts` | Pants list (order, store name, display name, price, link, pants + grey image and its box), label, View product / View all labels, body, hands and base-chinos layers, intro copy, cloud images | Product blocks + section settings |
| `PantsSection.tsx` | Markup only; calls `initPantsSection()` | `sections/unknown-pants.liquid` |
| `pants-section-behaviour.js` | All behaviour, plain JS, no libraries | `assets/unknown-pants.js`, copy as is |
| `pants-section.css` | All styles, scoped under `.unk-pants`, values from `../tokens.css` | `assets/unknown-pants.css` (drop the first `body:has()` rule) |

Motion reference and measured timings: `reference/unknown/MOTION.md` (videos in the same folder).

## Images: one fixed body, pants-only layers, hands on top

`public/products/unknown/pants-layers/` (a new folder this round, so no cache serves the older
full-photo files). Every layer belongs to **one fixed 3:4 canvas (1086 × 1448)** and is cropped to
its own content; its box on the canvas (`[x, y, width, height]`) is in `pants.data.ts`, and
`PantsSection.tsx` places it with percentages of the frame. Bottom to top:

| Layer | File | What it is |
|---|---|---|
| L0 body | `body.webp` (626 × 1317) | torso, arms, hands, shoes; never moves, scales or fades. Carries the one shared top fade |
| L1 pants, per state | `model-base.webp` (grey chinos, the neutral state), `<handle>.webp` per pair | pants only, waistband to hem, filled in under the hands |
| L1 ghost, per pair | `<handle>-grey.webp` | greyscale copy of the pants only (the ghost at the right) |
| L2 hands | `hands.webp` (626 × 418) | the base's arms and hands below the chest, so the hands stay in front of any pants |

Made by `scripts/build-unknown-pants-layers.py` then `scripts/optimize-unknown-pants.mjs`, from the
model photos in `assets/products-src/unknown/pants/` (method, checks and the last run's numbers in
`PROCESSING.md` there). In short: the body is what is the same in the photos (no skin-colour test,
so the brown pair, close to skin tone, separates by difference); each photo minus the body is its
pants. Every pair is registered onto the base first (Side Eye was 1.7% larger: scaled 0.983).
The body and hands come from four fixed reference photos, so adding or replacing a pair never
changes them (round 10: red added, brown replaced; body, hands, base and the other three pairs are
pixel-identical to round 8's files; see PROCESSING.md, "Body references").
Contact sheet (each pants on a checkerboard, composite vs original, body, hands, 50% overlay):
`assets/products-src/unknown/pants/aligned/contact-sheet.jpg`.

Measured: body + pants + hands rebuild each original photo to a mean 1.0-2.7 levels (0.4-0.8% of
pixels more than 40 levels off, at the cut lines). In the browser, the body's pixels are identical
in all five states (max 3 levels at 390, 11 on 16 edge pixels at 1440: rendering noise).

**Known limits** (hidden at rest, only in the moving copy during a swap): each hem's bottom edge
carries a 1-3px trace of the shoe beneath it, and a hand's soft shadow on the fabric stays on the
fabric (it slides 2% of the frame with the outgoing pair as it fades). Neither is visible at real
size against the sky in the recordings; both show if the cut-outs are viewed on a dark or patterned
background.

Why cropped layers: full-canvas layers are mostly transparent, yet the browser composites every
pixel of every layer on every frame of a swap. With full-canvas layers, desktop swaps dropped 9-17
frames over 20 ms; cropped, 1-3 (the old single-photo build: 1-4).

### Fade zone: one shared zone on the body

Rule: **the fade sits on bare skin only and never covers the pants.** The fade now lives on the
static body layer only (no pants layer has any fade), so there is one zone for every pair:
**0-35 px of the canvas**, ending 64 px (16 CSS px when the frame is 362 px tall) above the
**highest waistband of the body's reference photos (99 px, the previous brown)**. Waistbands
shown now (top, canvas px): base chinos 104, denim 109, side eye 104, brown 102, red 102, LGT 100
(`aligned/layers.json`): every one 65-74 px below the fade's end (red and brown 67), so the
on-screen margins below are the same or 1 source px better.

On screen the fade ends 17.4 CSS px (360 × 740), 21.1 (390 × 844), 30.0 (768 × 1024), 26.2
(1024 × 768) and 32.0 (1440 × 900) above the highest waistband. **Short screens fall below 16 px**:
14.1-15.2 on a 667-tall phone (iPhone SE / 13 mini class, Galaxy S5), 10.9 at 320 × 568 and
11.3-11.9 on phones in landscape: the frame is smaller and the photos only have ~100 px of skin
above the waistband. The fade still never touches the pants. The fix is photos with more torso
(prompt below). Overlays: `reference/unknown/qa/round8/7-fade-overlays.jpg`.

> Use the first image as the exact pose and framing reference, but frame the shot so the navel and
> about 15% of bare torso above the waistband are visible. Keep everything else identical, same
> model, arms, stance, sneakers, lighting and white background; change only the pants.

The waist mist sits **behind** the model and ends 3% into the frame (43 px: past the fade, well
above every waistband; atmosphere only).

Atmosphere: `public/products/unknown/atmosphere/` (pre-rendered transparent WebP, made by
`scripts/generate-unknown-clouds.py`): `clouds-back.webp` 1600×700 (17 KB), `clouds-front.webp`
1600×500 (14 KB), alpha at most 40% / 34%, `mist.webp` 1600×360 (11 KB). No live blur anywhere.

## Data shape

```ts
type LayerBox = [number, number, number, number]; // x, y, width, height on the 1086 x 1448 canvas
type PantsItem = {
  handle: string;   // Shopify handle, also the image file name
  name: string;     // exact store name (uppercase): aria-label "View NAME", announcements
  display: string;  // same name in title case for the big type ("LGT" stays uppercase)
  price: string;    // formatted, e.g. "₦145,000"
  url: string;      // product page: the View product link
  image: string;    // pants only
  box: LayerBox;    // where image (and grey) sit on the canvas
  grey: string;     // the matching -grey.webp
  hidden?: boolean; // left out until its image exists
};
```

## Markup contract (what the JS looks for)

```
div.unk-hold                           wraps the hero and this section
  div.unk-hold__hero                   the hero, position: sticky (held while the section rises over it)
  section.unk-pants  style="--unk-pants-count: N+1"   (N pairs + the base state)
    .unk-pants__feather                8svh white edge above the section, with a faint mist band; JS
                                       fades it in over the first 8% of the rise (hidden at rest)
    [data-pants-stage]                 the pinned screen (sky gradient)
      .unk-pants__sky > img[data-cloud="back"], img[data-cloud="front"]
      .unk-pants__figure               the 3:4 canvas; each img placed by left/top/width/height %:
        img[data-pants-body]           L0 body (static)
        img[data-pants-layer]          state 0: the base chinos (opacity 1)
        img[data-pants-layer] × N      each pair's pants
        img[data-pants-grey] × N       pants-only grey ghosts
        img[data-pants-hands]          L2 hands (static, on top)
      div[data-cloud="mist"]           mist around the crop line, behind the figure (CSS background)
      button[data-pants-peek]          invisible box where the ghost rests (clickable: next pair)
      h2.unk-pants__label              "PANTS" eyebrow (on top of the name)
      article[data-pants-item]         state 0 intro ("5 pairs" / "Scroll to try each one on")
      article[data-pants-item data-url data-name] × N   [data-pants-name] (split into lines by
                                       JS), [data-pants-fade] price
      span[data-pants-view] > a[data-pants-cta]          the one View product link
      .unk-pants__nav                  [data-pants-current] [data-pants-progress] [data-pants-prev]
                                       [data-pants-next] .unk-pants__all > a ("View all")
      [data-pants-status]
(no tail element: the next section's top padding carries the fade from the sky into white,
 see "Release" below)
```

## Motion, in plain English

Measured first; numbers in `reference/unknown/MOTION.md` (v2 table). Unchanged this round; the same
values now move **the pants layers only** (body and hands never move).

- **Entry:** the hero is held (`position: sticky`) and the section scrolls up over it. Its top
  edge is a short, faint white fade (8svh) with a faint white mist band (10svh at 60%). Nothing in
  the veil is darker than 2.0% grey. Two faint cloud layers (faintness baked into the images'
  alpha) rise a little slower than the section and drift sideways with progress; the waist mist
  drifts the other way. All by `transform`; the hero is clean at rest.
- **Pinning** is CSS: the stage is `position: sticky`, `100svh` tall (the small viewport: the
  browser's bars can never cover it). The section is `112svh + (states - 1.2) x 94svh` tall: a
  0.12-screen lead-in, then 0.94 of a screen per state, ending exactly where the last pair has
  settled (it **releases immediately**). The same numbers are `LEAD` / `STEP` in the JS.
- **Release:** the bottom row sits `--pants-inset` (+ the safe-area inset) above the stage's
  bottom (32px; 16px on portrait and short screens); the next section's top padding is the section
  gap minus that inset, so the visible gap to New Arrivals is exactly the section gap.
- **Rest state 0:** the model in the base chinos, the first pair waiting at the right as a faint
  grey ghost, pants only (opacity `--peek-opacity`, 0.2).
- **One loop:** a single `requestAnimationFrame` loop; scroll position becomes a progress value `u`
  smoothed with a lerp (0.1 s). It runs only while something moves, writes only `transform` and
  `opacity` (cached), and reads layout on resize only. The scroll listener is attached only while
  the section is within a screen of the viewport (IntersectionObserver), so scrolling elsewhere on
  the page runs none of this code.
- **Holds and swaps:** each state holds still for the first and last 20% of its screen of scroll;
  the middle 60% scrubs the swap (follows the scroll, plays backwards going up):

  | Phase (share of the swap) | What happens |
  |---|---|
  | 5–80% | the ghost (grey + colour pants together) slides left onto the body, ease-out, still faint |
  | 50–85% | it turns solid: grey copy fades out, colour copy fades in |
  | 70–95% | only then the outgoing pants fade (short overlap: the legs are never see-through) |
  | 40–100% | the outgoing pants drift 2% of the frame width to the LEFT |
  | 35–100% | the next pair's ghost slides in from beyond the right edge to the ghost spot |
  | 15–45% (+6% per line) | old name rolls up and out, line by line |
  | 50–80% (+6% per line) | new name rolls up into place |
  | 15–40% / 55–85% | price and View product fade out / in (the link moves under the new price while invisible) |

- **No resting mid-swap:** if scrolling stops for 160 ms inside a swap, the picture eases to the
  nearest state on its own. The page itself is never moved.
- **First visit:** body, hands, the base and first pair and the clouds are decoded first
  (`img.decode()`), then (only if the visitor is still at the top) the stage is drawn once
  invisibly (opacity 0.001) at three entry positions so the one-time drawing work happens before
  the first scroll; then the remaining pairs. All layers load eagerly at low fetch priority (the
  section is below the fold; nothing may hold up the hero's LCP photo).
- **Reduced motion:** pants, ghost and text cross-fade in place; clouds stay still; arrows jump.
- **Performance:** no CSS filters, masks or live blur on anything that moves. 60 fps recordings of
  every swap (no GPU here, harsher than real devices): 1440 × 900 3 of 519 frames over 20 ms,
  390 × 844 0 of 536.
- **Overflow:** the mist bands are wider than the screen; `overflow-x: clip` on the section keeps
  the page from scrolling sideways on phones (use `clip`, not `hidden`, or sticky breaks).

## Type and colour

Hanken Grotesk on M3 roles: eyebrow Label Small, product name Headline Large (32/40; Headline Small
24/32 on short screens), price Body Large, intro line Body Medium, counter Label Medium, View product
and View all Label Large. Sky, white to white: `#F9FAFB` → `#FDFDFD`, ink 17.5:1, mute 6.4:1 (AA).

## Layout of the text and links

- **Details, top to bottom** (left column on wide screens, 30svh down; above the pants on
  portrait screens): the small "PANTS" eyebrow, the product name, the price, then **one "View
  product" link** (the shared text link: plain text, underline under the text only, no arrow,
  Label Large, 48px target), its text 16px under the price. It always links to the pair on screen
  and updates on every swap (`aria-label="View [NAME]"`); on the intro state (no pair) it is hidden
  and out of the tab order.
- **No bottom bar any more:** thumbnail, name, price and Add to cart were removed; nothing sits
  below or in the middle of the pants.
- **Bottom row:** counter ("01 / 05"), progress line, previous / next on the left; **"View all"**
  (same link component, to `/collections/pants`) at the bottom right, on the right content margin,
  on the counter's baseline (both texts on a 20px line in the same 48px row: measured 0px apart).
- Exactly one link to a pair and one to the collection; tab order View product, previous, next,
  View all. Measured at 1440 / 1024 / 768 / 390 / 360 over 41 scroll positions each (every rest and
  mid-swap), no text or link overlaps the model, the ghost or the site header.
- **Portrait screens** (any width, `max-aspect-ratio: 5/4`): the details sit above the pants
  (eyebrow + up to three lines of name + price + View product), the frame starts below them and
  never under them; the bottom row runs across the full width. Landscape phones keep the
  side-by-side layout with the details from the top.

## Add to cart was removed: what the Shopify version needs

The prototype has no add-to-cart in this section: View product goes to the product page, where
size is chosen. If the client wants to buy from the section, the theme needs, per pair: a size
(variant) picker (`product.variants`, sold-out sizes disabled), a POST to `/cart/add` (or the theme's
cart API) with the chosen variant id, an error / success message in a polite live region, and the
cart count in the header updated. Sold-out and compare-at prices would need states too. Without a
size picker an add-to-cart cannot work (every pair has sizes), so a single button is not enough.

## Accessibility

Real `<h2>` ("PANTS") and `<h3>` names; only the active pair's text is reachable (`inert` +
`aria-hidden` on the others, switched at the halfway point of a swap); a polite live region
announces "2 of 4: NAME, PRICE"; the counter shows "—" on the intro; 48px targets; arrows use
`aria-disabled` so focus is never lost; the layers are decorative (`alt=""`) because the name is
announced.

## Shopify version

- **Section settings:** `label` (text, "PANTS"), `view_product_label` (text, "View product"),
  `view_all_label` (text, "View all") and `view_all_url` (url, `/collections/pants`),
  `body_image`, `hands_image` and `base_image` (image_picker, the three fixed layers from the build
  script, with their boxes as text or number settings), `intro_meta` (text, "Scroll to try each one
  on"; the intro title is "{{ section.blocks.size }} pairs"). Cloud images ship as theme assets.
- **Blocks:** type `pair`, limit 8, settings `product` (product picker), `pants_image` and
  `grey_image` (image_picker: that pair's pants-only layer and its grey copy from the build script),
  `box` (text "x,y,w,h" from `layers.json`), and an optional `display_name`. Name, price and URL
  come from the product.
- **Markup:** body layer, then the blocks' pants layers, again for the grey copies, then the hands
  layer, each `<img>` with its box as inline `left / top / width / height` percentages; loop the
  blocks again for the articles (`data-url="{{ product.url }}" data-name="{{ product.title }}"`,
  `block.shopify_attributes`); one View product link (first pair's URL in the markup; the JS takes
  over). Images: `{{ img | image_url: width: 1086 | image_tag: widths: '320, 480, 640', alt: '',
  loading: 'eager', fetchpriority: 'low' }}` with `sizes` scaled by the layer's share of the canvas
  width (as `PantsSection.tsx`).
- **JS:** wrap in a custom element so the theme editor's section reloads work automatically:
  ```js
  class UnknownPants extends HTMLElement {
    connectedCallback() { this.cleanup = initPantsSection(this.querySelector(".unk-pants")); }
    disconnectedCallback() { this.cleanup?.(); }
  }
  customElements.define("unknown-pants", UnknownPants);
  ```
  Optional: on `shopify:block:select`, scroll to that pair.
- **Held hero:** in the theme the hero and pants are two sections, so wrap neither; give the hero
  section `position: sticky; top: 0` and the pants section a higher `z-index` and
  `position: relative` (same effect as `.unk-hold`), and the next section the
  `.unk-hold + .unk-section` padding / fade rule (a class on that section).
- **CSS:** drop the `body:has()` rule (a theme page scrolls normally); no ancestor of the section
  may have `overflow: hidden/auto` (it would break `position: sticky`). The page needs
  `viewport-fit=cover` in its viewport meta for the safe-area insets.

## Round 10: red added, brown replaced (27 Oct 2026)

Five pairs, in this order: denim, side eye, **brown (new wide-leg photo)**, **red (new)**, LGT.
Red: UNKNOWN LOGO SWEATPANT RED, ₦100,000, `/products/unknown-logo-sweatpant-red`. The counter,
intro ("5 pairs"), previous / next, the swap, the View product link and its `aria-label`, the
screen-reader status ("4 of 5: UNKNOWN LOGO SWEATPANT RED, ₦100,000"), preload and decode-ahead all
read the data list (`pants.length`), so no code changed; checked in the browser at 1440 and 390.
The previous brown photo is in `assets/products-src/unknown/pants/previous/` (still a body reference).

Alignment of every photo to the base (subject masks after registration; Δ = difference to the base):

| Photo | Arm span px | Δ | Shoe line y | Δ | Left shoe centre x | Δ | Right shoe centre x | Δ | Waistband y | Δ |
|---|---|---|---|---|---|---|---|---|---|---|
| base | 618 | – | 1314 | – | 376 | – | 704 | – | 104 | – |
| denim | 618 | 0.00% | 1314 | 0.00% | 375 | −0.13% | 702 | −0.14% | 109 | +4.81% ⚠ |
| side eye | 621 | +0.49% | 1313 | −0.08% | 371 | −1.20% | 704 | +0.14% | 104 | 0.00% |
| brown (new) | 617 | −0.16% | 1314 | 0.00% | 374 | −0.27% | 704 | 0.00% | 102 | −1.92% ⚠ |
| red (new) | 618 | 0.00% | 1314 | 0.00% | 375 | −0.13% | 704 | 0.00% | 102 | −1.92% ⚠ |
| LGT | 617 | −0.16% | 1314 | 0.00% | 376 | +0.13% | 704 | +0.14% | 100 | −3.85% ⚠ |

The only values over 1.5% are waistband heights: each garment's own rise, not misregistration, and
large in percent only because the base value is small (2 px = 1.9%; 0.14% of the 1448 px frame).
All sit 65 px or more below the fade.

- **Wide hems:** brown's layer spans canvas x 248-832 (584 px, the widest pair), red's 268-823; both
  inside the 1086 px canvas and inside their own crop (2 px clear). In the browser no pants layer
  is clipped on any side by the frame, a clip or the viewport at 1440 × 900 or 390 × 844.
- **Cut-outs** (`reference/unknown/qa/round10/3-cutouts-*.jpg`): first run had skin flecks above
  brown's waistband and grey shoe slivers inside both hems; fixed in the script (new-pair clean-ups,
  PROCESSING.md). Shipped: no holes, no skin above either waistband (checked at 2x on black), hems
  free of shoe (2 shoe-coloured px left in red, 0 in brown), a 1px soft edge like the other pairs.
  Where the base chinos covered the shoe tops and these hems don't, ~2,500 px (0.2% of the figure)
  show the page white under the hem: white shoe on white, no visible edge.
- **Overlay / ghosting:** the five settled states differ by ≤ 1 level on the body at 390 and ≤ 10
  (sub-pixel resampling) at 1440; the larger differences are the wide hems themselves.
  `4-overlay-five-composites.jpg`, `4-settled-states-*.jpg`.
- **Mid-swap** (u ≈ k.46, every transition, 1440 and 390): `4-mid-swap-*.jpg`. Brown → red and
  red → LGT: body still, only the pants move, the fade on bare skin only.
- **60 fps** through all five swaps: desktop 1440 0 of 617 frames over 20 ms, phone 390 0 of 634.
