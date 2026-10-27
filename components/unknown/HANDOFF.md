# UNKNOWN homepage prototype (/unknown): handoff

A visual prototype of a new UNKNOWN homepage, built to be ported section by section to a Shopify
theme. Each section is self-contained: its own folder, plain CSS, a small plain-JS file where it
has behaviour, and a data file holding all copy, prices, images and links. No new libraries.

Page order: **Rack hero → Pants → New Arrivals → Two Piece → Caps → Slides → Lookbook → Visit + email → Footer.**
(The "Subtle Growth" drop band was removed.) Route: `app/unknown/page.tsx`.

## Files

| Section | Folder / files | Behaviour | Becomes in Liquid |
|---|---|---|---|
| Design tokens | `tokens.css` | – | theme base CSS variables (`assets/base.css`) |
| Shared section / link / button styles | `section.css` | – | part of `assets/base.css` |
| Text link ("View all", "View product", "Get directions") | `link/UnkLink.tsx` + `.unk-link` in `section.css` | CSS only | `snippets/unk-link.liquid` |
| Hero header + compact menu | `header/` (`UnknownHeader.tsx`, `header.data.ts`, `header-behaviour.js`, `header-styles.css`, `Icon.tsx`) | `header-behaviour.js` | `sections/unknown-header.liquid` (header group) |
| Rack hero, desktop | `UnknownShowroom.tsx`, `app/unknown/unknown.css`, `lib/unknown-products.ts`, `lib/unknown-brand.ts`, `desktop-rack/` (`DesktopRack.tsx`, `desktop-rack-behaviour.js`, `desktop-rack.css`) | `desktop-rack-behaviour.js` (scrolling) + the shared rack's hover / turn | `sections/unknown-hero.liquid` |
| Detail view (focus) | shared `components/focus/` + `.unknown-showroom .focus` in `app/unknown/unknown.css`; size picker in `size-picker/` (`SizePicker.tsx`, `size-picker-behaviour.js`, `size-picker.css`) | shared focus code; `size-picker-behaviour.js` | inside `sections/unknown-hero.liquid` (see "Detail view") |
| Phone swipe hint | `swipe-hint/` (`SwipeHint.tsx`, `swipe-hint-behaviour.js`, `swipe-hint.css`, `swipe-hint.data.ts`) | `swipe-hint-behaviour.js` + `nudge()` in `mobile-rack-behaviour.js` | inside `sections/unknown-hero.liquid` |
| Currency selector | `currency/` (`Currency.tsx`, `currency-behaviour.js`, `currency-styles.css`, `currency.data.ts`) | `currency-behaviour.js` | inside the header section + Shopify's localization form |
| Rack hero, phones (< 600px) | `mobile-rack/` (`MobileRack.tsx`, `mobile-rack-behaviour.js`, `mobile-rack-styles.css`) | `mobile-rack-behaviour.js` | inside `sections/unknown-hero.liquid` |
| Pants | `pants-section/` | `pants-section-behaviour.js` | `sections/unknown-pants.liquid` (see `pants-section/HANDOFF.md`) |
| New Arrivals | `new-arrivals/` | CSS only (hover) | `sections/unknown-new-arrivals.liquid` |
| Two Piece | `two-piece/` | CSS only | `sections/unknown-two-piece.liquid` (one product picker) |
| Caps | `caps/` | CSS only (hover) | `sections/unknown-caps.liquid` |
| Slides | `slides/` (`Slides.tsx`, `slides.data.ts`, `slides-behaviour.js`, `slides-styles.css`) | `slides-behaviour.js` (Pair / Strap, tilt) | `sections/unknown-slides.liquid` (one product + two images) |
| Lookbook | `lookbook/` | `lookbook-behaviour.js` (arrow buttons) | `sections/unknown-lookbook.liquid` |
| Visit + email | `visit/` | `visit-behaviour.js` (prototype submit) | `sections/unknown-visit.liquid` |
| Footer | `footer/` | – | `sections/footer.liquid` (theme footer group) |
| Reveal on scroll | `reveal/` | `reveal-behaviour.js` | `assets/unknown-reveal.js`, loaded once in `theme.liquid` |

## Design system (tokens.css)

Every value on /unknown comes from a published system. One rule per row, with its source:

| Rule | Value | Token(s) | Source |
|---|---|---|---|
| Spacing scale | 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 px. No other margin / padding / gap values | `--space-2` … `--space-96` | Material 3 spacing / IBM Carbon spacing (8px grid) |
| Section-level spacing | 16, 24, 32, 48, 64, 96, 160 | `--space-*`, `--layout-160` | IBM Carbon layout tokens |
| Section rhythm | gap between consecutive sections: **64** compact + medium, **96** expanded; applied once, as `padding-top` on the lower section (`.unk-section`), so gaps never double. 160 kept for the hero-to-pants transition (not needed: the pants section overlaps the held hero) | `--section-gap` | IBM Carbon layout tokens |
| Window classes | compact 0-599: 16 margin, 4 columns, 16 gutter. Medium 600-839: 24 margin, 8 columns, 24 gutter. Expanded 840+: 24 margin (32 from 1200), 12 columns, 24 gutter, centred 1440 max content width. Every margin is `max(token, safe-area inset)`: it only grows on notched phones in landscape (the page uses `viewport-fit=cover`) | `--margin`, `--columns`, `--gutter`, `--content-max` | Material 3 window size classes / layout; safe areas: CSS env() |
| Viewport units | `svh` for the pinned pants stage and everything sized to the screen height (never `100vh`, so the mobile browser bars cannot break it); `dvh` for the hero and the menu's max height | – | CSS Values 4 |
| Hover | every `:hover` effect sits inside `@media (hover: hover)`, so touch screens never get a stuck hover state | – | Material 3 states (hover is a pointer state) |
| Top app bar | 64px tall on compact, 4px edge padding around 48px icon buttons | `.unk-header` | Material 3 top app bar |
| Type roles (size/line-height, weight) | Display L 57/64 · Headline L 32/40 · Headline M 28/36 · Headline S 24/32 · Title L 22/28 · Title M 16/24 (500) · Body L 16/24 · Body M 14/20 · Label L 14/20 (500) · Label M 12/16 (500) · Label S 11/16 (500); M3 tracking per role | `--type-*` (`font` shorthand) + `--track-*` | Material 3 type scale |
| Touch targets | 48 x 48 minimum; short text links (a 37px "Pants" in the footer) get an invisible centred 48 x 48 hit box (`.unk-hit48`), layout and underline unchanged | `--target` | Material 3 (meets Apple HIG 44pt and WCAG 2.2 2.5.8 target size) |
| State layers | hover 8%, focus 10%, pressed 10%, in the element's content colour | `--state-*`, `.unk-state` | Material 3 states |
| Focus ring | 2px solid ink, 2px offset (15:1 on white) | `--focus-ring`, `--focus-offset` | WCAG 2.2 2.4.13 focus appearance |
| Text contrast | AA everywhere: mute `#5c5c5c` 6.6:1 on white, 6.0:1 on the pants sky | colour tokens | WCAG 2.2 1.4.3 |
| Shape | 12px corners on buttons, inputs and containers (cards, wells, menu panel) | `--radius-button` | brief |
| Scrim | ink at 32% behind the menu | `.unk-menu__scrim` | Material 3 scrim |
| Elevation | menu panel: M3 level 2 shadow | `.unk-menu` | Material 3 elevation |
| Easing | standard `cubic-bezier(0.2, 0, 0, 1)`; emphasized-decelerate `(0.05, 0.7, 0.1, 1)` (entering); emphasized-accelerate `(0.3, 0, 0.8, 0.15)` (leaving) | `--ease-*` | Material 3 motion |
| Durations | short 100 / 150 / 200, medium 250 / 300 / 400, long 500 ms | `--dur-*` | Material 3 motion |
| Motion exceptions | the pants swap, the hero-to-pants entry and the phone rack keep the values measured from the reference videos (`reference/unknown/MOTION.md`), not M3 tokens | – | measured |

**Type mapping (every text element):**

| Element | M3 role |
|---|---|
| Hero ABOUT, Close (focus view) | Label Large, uppercase |
| Hero rack caption (desktop hover), phone rack caption | Label Medium / Label Large |
| Menu: top-level rows / children | Title Medium / Body Large |
| Section label ("Just in", "Headwear", "Visit the store", "Email list"), pants "PANTS" | Label Small, uppercase |
| Lookbook label "Look-Book" / headline | Label Medium, uppercase / Headline Medium |
| Two Piece eyebrow / product name / price | Label Medium, uppercase / Title Large / Title Medium |
| Section titles (New Arrivals, Caps, Lookbook) | Headline Large |
| Pants product name | Headline Large (was a fluid 28-46px) |
| Pants price / intro line / counter | Body Large / Body Medium / Label Medium |
| Text links (View product, View all, Get directions), Sign up | Label Large, uppercase |
| Card names (New Arrivals, Caps) / prices | Label Large (same metrics as M3 Title Small) / Body Medium |
| Visit address and email lead / hours / email field / status line | Title Large / Body Large / Body Large / Body Medium |
| Footer | **unchanged on purpose** (brief: keep the footer exactly as it is): 15px links, 13px base line, 11px column titles. Mapping them would be Body Large 16 / Body Medium 14 / Label Small 11 |

**What the audit changed** (git diff against the previous round, `e41921d`): 62 spacing declarations, 68 type declarations, 16 motion declarations, 4 radius and 7 target declarations rewritten; 134 token references renamed onto the new scale (36 of them changed value: durations and easing onto M3, the fluid gutter onto the window-class margins, targets 44 → 48). Off-scale values found and replaced:

| Was | Where | Now |
|---|---|---|
| 128px (`--unk-s9`) top padding + 96px bottom padding (gaps of 192-224px) | New Arrivals, Caps | one-sided section gap 96 / 64 |
| 96px top + bottom padding (doubled gaps) | Lookbook, Visit, footer | one-sided section gap |
| `clamp(16px, 4.17vw, 64px)` gutter (60px at 1440) | every section | M3 margin 16 / 24 / 32 |
| 28vh fade strip + 128px padding + dead scroll after the last pair | pants > New Arrivals | section gap minus the pants bottom inset (fade carried in that padding) |
| 48px bottom padding on the lookbook row | Lookbook | 0 (hover captions hang below without taking space) |
| 28px reserved status line under the sign-up form | Visit | positioned under the form, no reserved space |
| 6px link gap, 3px underline offset | text links | arrow removed; 2px |
| `2.2vw` header padding; 16px / 12px on phones | hero header | `--margin` (32 at 1440, as the draft); 4px M3 top-app-bar padding on compact |
| 10px, 20px, 28px | hero Close icon, chooser padding, rack caption offset | 8, 24, 24 |
| 44px targets | all controls | 48px |
| 20px buy-bar radius (concentric) | pants | 12px (containers are 12px) |

## Hero header and compact menu (`header/`)

- No solid bar; it sits on the hero's white wall. **Expanded / medium:** ABOUT left (Label Large),
  wordmark centred (12.55% of the viewport width, as the draft), search / account / cart right
  (Hugeicons `search-02`, `user-02`, `shopping-cart-02` from `icon-paths.ts`, 24px glyphs in 48px
  targets, the last glyph aligned to the content margin).
- **Compact (< 600px, and touch phones in landscape up to 500px tall):** no left control (ABOUT
  moves into the menu); on the right, in order, search, account, cart and the **hamburger at the
  far right** (same Hugeicons set, 1.5px strokes, 24px glyphs in 48px targets). Transparent, no
  bar, as on desktop. **Wordmark:** the brief asked for it centred. Four 48px targets plus the 4px
  edge take 196px, which reaches past the middle of any phone narrower than 392px; a truly centred
  wordmark therefore needs `2 x (196 + 16) + 64 = 488px`. Measured with the requested layout forced:
  a centred 112px wordmark overlaps the icons by 92 / 72 / 57 / 37px at 320 / 360 / 390 / 430
  (`reference/unknown/qa/round8/6c-header-requested-vs-shipped.jpg`). So: **488px and wider**
  (large phones in landscape, small tablets): centred, as requested. **Below 488px:** the
  alternative, the wordmark on the left content margin (16px), 92-112px wide, 16-106px clear of
  the icons, targets kept at 48px. Trade-off: the wordmark is not centred on portrait phones (the
  same structure as the reel's top bar); the other option, shrinking the targets to 44px, still
  only fits a centred wordmark from 424px, so it would not help at 390 or 360.
- **Menu:** a white dropdown panel under the header (12px bottom corners, M3 level-2 shadow) with
  the store navigation from `header.data.ts`: Our Collections (Caps, Jackets, Shirts, Pants, All),
  Best Sellers, New Arrivals, Look-Book, Contact, About Us, Shop All. 48px rows, Title Medium top
  level, Body Large children, hairline dividers; "Our Collections" expands in place.
  The live store's own "Jackets" item links to `#` (no jackets collection; `/collections/jackets`
  is a 404), so it points at `/collections/all` until the collection exists.
- Opens with M3 emphasized-decelerate (400ms), closes with emphasized-accelerate (200ms); the
  page behind dims (32% scrim); the hamburger morphs into a close icon (transform only).
- Closes on Esc, a tap outside (scrim), a link tap or the hamburger. Focus moves to the first row
  and is trapped (Tab / Shift+Tab cycle through the hamburger and the panel only); Esc returns it
  to the hamburger. `aria-expanded` / `aria-controls` on the hamburger and on Our Collections; page
  scroll locked while open (`html.unk-menu-open`); reduced motion: no slide, no morph animation.
- Clears the notch: `padding-top: env(safe-area-inset-top)` and side insets in landscape; the menu
  panel opens below that. In landscape the panel scrolls within the screen (measured at 844 x 390
  and 667 x 375: opens, scrolls, Esc closes).
- **Liquid:** `sections/unknown-header.liquid` in the header group; rows from
  `linklists['main-menu'].links` (child links → the expandable group); icons link to
  `routes.search_url`, `routes.account_url`, `routes.cart_url` (add `cart.item_count` as a badge if
  wanted). Load `header-behaviour.js` as is and call `initHeaderMenu(headerEl)` (custom element as
  for pants).

## Phone rack (`mobile-rack/`, compact screens only)

Measured from the client's reel (`reference/unknown/video-c-mobile-rack.mp4`; method and raw
numbers in `reference/unknown/MOTION.md`, "v4") before coding; every value lives in the `CONFIG`
block of `mobile-rack-behaviour.js` and the custom properties at the top of
`mobile-rack-styles.css`.

| What | Provisional (round 6) | Measured from the reel, now used |
|---|---|---|
| Rail | static, past both screen edges, 24px under the header | static; centre 26vw under the header icons; ~1.3vw thick. **Round 8:** an end bracket on each side margin line; garments hang in a strip clipped at the margins and pass behind the brackets (reel: garments cut off at x = 1.3% and 97.2% of the screen, at the brackets' outer edges; brackets ~2.7vw x 6.2vw). Mapped to the 16px compact margin and a 12 x 24px bracket |
| Garments across | 3 | 3 whole + slivers at both edges |
| Hanger spacing | 33.3vw | **27.8vw** |
| Garment size | photo 64vw wide | sized so each hangs **66vw** from the rail to the hem (photo 55vw wide); side views ~17-19vw wide |
| Centred front view | 1.12 x larger | same size as the side views (front hem = side hem) |
| Neighbours of the front view | not moved | pushed out **10.9vw** each side (further garments shift too), over **400ms**, ease-out |
| Drag | 1:1 | 1:1 (confirmed) |
| Glide | time constant 325ms, aimed to land on a garment | time constant **100ms** (speed x0.715 per 33ms), ~430ms to rest, **no snap mid-glide** |
| Settle | turn when the glide ends | rest **300ms**, then the garment nearest the centre is eased into the centre (**300ms**, ease-in-out) |
| Side to front | 3D turn (desktop spring) | **cross-fade**, **100ms**, starting 100ms into the spread |
| Centre | nearest the screen centre | nearest the screen centre when the row stops (confirmed) |
| Sway | none | damped pendulum about the hook: period **1.37s**, damping ratio **0.2**, ~3.9deg for a fast glide; the hem lags as the row speeds up and swings on as it slows |
| Ends | rubber band 0.35 | **not measurable** (the reel never reaches an end; it loops back to its own first frame, which is what read as "returning to the first garment"): rubber band 0.35 kept, the only unmeasured value |
| Tap | centre opens the focus view | confirmed (the reel's focus view: Close, Front / Back, counter) |
| First load | garment 0 facing front | **round 8 (brief):** every garment on its left-facing side view, evenly spaced; the side-to-front turn only starts after the visitor has dragged and the row has come to rest (tap on the centre garment still opens it) |
| Indicators | none | none (the dots under the reel belong to the reel itself) |

Implementation: pointer events, one `requestAnimationFrame` loop that runs only while something
moves and writes only `transform` / `opacity` (plus a z-index and the caption text when the centred
garment changes); layout is read on resize only. Vertical swipes scroll the page
(`touch-action: pan-y` + horizontal-intent detection, 6px). Each photo hangs by its own measured
hook loop (same geometry as `components/Garment.tsx`); every side view faces left (`mirrorSide`,
below). Every garment is server-rendered on its side view, evenly spaced, so the first paint needs
no JavaScript (garment 0's side photo is the mobile LCP image, fetch priority high). Reduced
motion: dragging works, the row snaps without gliding, the swap and the gap are instant, nothing
sways. The focus view opens from the centred garment; when it closes, the rack takes over on the
side view and, once the row has been dragged at least once, turns to the front after the usual
300ms rest (`resume()`).
**Liquid:** inside `sections/unknown-hero.liquid`, one `<li>` per garment block (side + front
image, `image_url` widths as the desktop rack); load `mobile-rack-behaviour.js` and call
`initMobileRack(el, { onSelect })`, where `onSelect(index, origin)` opens the focus view.

## Every garment faces left (`mirrorSide`)

Re-checked in round 8 with a labelled contact sheet of every side photo at 3x beside its front
(`reference/unknown/qa/round8/2-rack-facing-contact-sheet.jpg`), using real cues (the collar dips at
the front, the hood's bulk sits at the back, zip / buttons / placket at the front, front-only prints):

| Garment | Side photo faces | Cue | Evidence |
|---|---|---|---|
| Beige Panel Jacket | left | grey front panel + flap pocket on the left edge; collar point projects left | strong |
| Orange Bird Knit Vest | left | the front-only bird print shows on the left edge (back is plain) | **medium** (a sliver of print) |
| Black Graphic Jacket | right → mirrored | collar dips, button placket and welt pockets on the right | strong |
| Green Panel Plaid Shirt | right → mirrored | collar dips, button placket on the right | strong |
| Ivory Hoodie | left | hood bulk (back) on the right; chest label on the left | strong |
| Grey Zip Hoodie | left | zip + kangaroo pocket on the left; hood bulk on the right | strong |
| Blue Striped Tee | left | the front-only "shhshhsh" print shows on the left edge; sleeve hangs forward | **medium** (a few px of print at rack size) |

The flags were already right (rendered at 3x on desktop and on the phone rack, every front points
left). What read as "facing different ways" on phones was the centre garment showing its **front**
on first load; that is gone (first load is side views only, see the phone rack). The **black jacket** and the **green plaid shirt** face right as photographed; the other five face left. Those two
carry `mirrorSide: true` in `lib/unknown-products.ts`: their side photo (only) is drawn with
`transform: scaleX(-1)` about the middle of its hook loop, on the desktop rack, its hook crest, the
focus view's fly-in / out and the phone rack. Front and back photos are never flipped. Measured
after the flip: every hanger neck stays within 0.2px of its slot. **Known:** the black jacket's side
photo has "unknown" embroidered down the sleeve; mirrored, that small lettering reads backwards
(about 5px tall on the desktop rack, larger on phones). A left-facing side photo of the jacket would
fix it. Liquid: a per-block checkbox setting `mirror_side`.

## Fonts and loading them in Shopify

**Hanken Grotesk** (SIL Open Font License, free), weights 400 and 500. It's the closest free match
to the reference's product-name type (a Helvetica-style neo-grotesque); comparison in
`reference/unknown/font-compare.png`. Close, not identical. Options in the theme:
1. **Self-host (recommended):** download the woff2 files (Google Fonts / google-webfonts-helper),
   upload to `assets/`, then in `base.css`:
   ```css
   @font-face { font-family: "Hanken Grotesk"; src: url("{{ 'hanken-grotesk-400.woff2' | asset_url }}") format("woff2"); font-weight: 400; font-display: swap; }
   @font-face { font-family: "Hanken Grotesk"; src: url("{{ 'hanken-grotesk-500.woff2' | asset_url }}") format("woff2"); font-weight: 500; font-display: swap; }
   :root { --font-unk: "Hanken Grotesk"; }
   ```
   (put the `@font-face` rules in a `.css.liquid` asset or a `<style>` in `theme.liquid` so the
   `asset_url` filter runs) and preload the 500 weight in `theme.liquid`.
2. **Google Fonts link** in `theme.liquid`: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` and
   `<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">`.

The hero header now uses Hanken Grotesk too (Label Large, 14/20, uppercase), like the rest of the
page.

## Sections in Liquid

**Pants:** see `pants-section/HANDOFF.md` (product blocks + model image per block).

**New Arrivals** (`new-arrivals/`)
- Settings: `label` (text, "Just in"), `title` (text, "New Arrivals"), `collection`
  (collection picker → **`new-arrival`**), `limit` (range 4–12, default 8).
- Markup: `{% for product in section.settings.collection.products limit: section.settings.limit %}`;
  first image = `product.featured_image`, hover image = `product.images[1]` (skip the hover layer
  if there is none); price `{{ product.price | money }}`; link `product.url`; "View all" →
  `section.settings.collection.url`.
- Prototype data: the first 8 real products of `/collections/new-arrival` in store order (names,
  ₦ prices, links, store photos via `scripts/optimize-unknown-store-photos.mjs`). Product photos
  sit in square wells with `mix-blend-mode: multiply` so their white backgrounds match.
- "View all" → `/collections/new-arrival`.

**Caps** (`caps/`)
- Settings: `label` ("Headwear"), `title` ("Caps"), `collection` (collection picker →
  **`headwear`**).
- Blocks: type `cap`, limit 4, setting `product`. Prototype shows exactly these four, real data
  and photos from the store: UNKNOWN SV SNAPBACK RED ₦70,000, UNKNOWN VRS ₦100,000, UNKNOWN SV
  SNAPBACK BLACK ₦70,000, UNKNOWN FUR CLOUD BEANIE ₦80,000. Hover image = `product.images[1]`
  where one exists. 4 across on desktop, 2 across on phones.
- "View all" → `/collections/headwear`.

**Two Piece** (`two-piece/`, between New Arrivals and Caps)
- One product as an editorial moment: a 4:5 photo cropped to the figure (`two-piece.data.ts` holds
  the crop box: the store photo has wide white margins), the details beside it on expanded and
  medium widths, under it on compact: eyebrow "Two piece" (Label Medium), name (Title Large),
  price (Title Medium), one text link "View product" (no arrow; no "View all": one design).
- Prototype data: UNKNOWN JT LOGO PIECE, ₦120,000, `/products/unknown-jt-logo-piece`; the store
  has one photo for it (original in `reference/two-piece/`), so there is no image swap. With two or
  more photos, swap them on hover / tap with M3 motion (standard easing, medium-2).
- **Liquid:** `sections/unknown-two-piece.liquid` with settings `label` (text, "Two piece") and
  `product` (product picker: picks one product). Name `product.title`, price
  `{{ product.price | money }}`, link `product.url`, photo `product.featured_media` (crop with
  `object-fit: cover` + `object-position`, or a `crop` focal point setting), `product.media[1]` for
  the optional swap.

**Lookbook** (`lookbook/`)
- Photos: 14 looks from `/pages/unknown-lookbook` (store originals in `reference/lookbook/`,
  web versions in `public/products/unknown/lookbook/`).
- Settings: `label` (text, "Look-Book", Label Medium), `title` (text, Headline Medium; the
  prototype shows "Off the rack", **provisional** until the client confirms the heading). No
  "View all" link (removed on every breakpoint).
- Blocks: type `look`, settings `image` (image_picker, with its alt text) and optional `product`
  (product picker). No visible caption ("Look 01" etc. were removed); when a product is set, its
  name shows as a text link under the photo on hover (always visible on touch screens; with a
  pointer it hangs below the photo without taking layout space, so the section gap stays exact). Only looks 04, 05 and 08 have a product in the
  prototype (Original Tranquility Jersey, Ligne Noire Hoodie, Shhshhsh Jersey): the others could
  not be matched to a product with certainty.
- Layout: a horizontal row with CSS scroll-snap, mixed heights (even looks sit lower), native
  swipe on touch, prev/next buttons on desktop (`initLookbook(sectionEl)`, same custom-element
  wrapper as pants). Long product names wrap under the photo (never cut off).
- **Scroll lag (round 8), profiled before fixing** (Chrome traces, 4x CPU throttle, MacBook 1512 @2x
  and phone @3x, wheel / touch input, up from the footer and down): each photo was decoded on the
  frames it first came on screen: AVIF (the image optimizer served AVIF; it decodes several times
  slower than WebP), sized from `32vw` (a 9:16 look ~300px wide got the 1080px file), ~60-75 ms per
  photo at 4x, about 1 s per cold pass, worst frame 216 ms. No layout shift, no network during the
  scroll, no filter / backdrop-filter / will-change in the section; the reveal already runs once;
  the scroll-snap row and the hover zoom measured no difference when switched off. Fixed: WebP only
  (`next.config.ts`), `sizes` per look from its own ratio and the slot's clamp (no file over ~1.7x
  its display size), and the row is decoded one photo at a time in idle time when the section comes
  within two screens, from either direction (`lookbook-behaviour.js`). Also: the pants section's
  scroll listener is detached while that section is far away. Frame tables under Verification.
- **Liquid:** `image_url` widths from 320 to 1080 with the same `sizes` rule; keep the
  IntersectionObserver predecode from `lookbook-behaviour.js`.

**Visit + email** (`visit/`)
- Settings: address lines (text × 3), `hours` (text), `email_copy` (text, "Get exclusive deals and
  early access to new products").
- Form: wrap the same markup in `{% form 'customer', class: 'unk-signup' %}` with
  `<input type="hidden" name="contact[tags]" value="newsletter">`; show `form.posted_successfully?`
  and `form.errors` in the `[data-signup-msg]` line. Then `visit-behaviour.js` is no longer needed.
- `id="visit"` is kept as an anchor (the footer's "Visit the store" link).
- Spacing (round 8): the section keeps the section gap below its content too (`padding-bottom:
  var(--section-gap)`), so the white runs 96 / 64 px from the last content (Get directions, the
  email field) to the footer's warm wall; the footer then has its own section-gap top padding inside
  the wall. Measured: 0 px before, 64 / 64 / 64 / 96 / 96 at 360 / 390 / 768 / 1024 / 1440.

**Footer** (`footer/`): menus from `linklists` (Shop: New arrivals, Pants, All products;
UNKNOWN: About, Visit the store). Layout: wordmark left; the two link columns sit side by side as
one group on the right edge of the content (64px apart); on compact screens the group stacks under
the wordmark (48px apart); copyright row below. Colours exactly as before round 6: background
`#E9E8E4`, text `#151515`, muted `#5C5C5C` (round 6's shared white section background had
overridden the background; fixed with a two-class rule). The address and opening-hours lines under
the wordmark were **removed** (the Visit section right above shows both); to bring them back,
restore the `<p>` in `Footer.tsx` and its rule in `footer-styles.css` (git `5f68f27`).

**Hero** (`UnknownShowroom.tsx`): header from `header/` (see above), wordmark as an image setting
(`image_picker`, SVG), garments as blocks (one per garment with front/side/back images). The
`on` flag in `lib/unknown-products.ts` = whether a block is present: on, in draft order,
beige-panel-jacket, orange-bird-vest, black-jacket, green-plaid-shirt, ivory-hoodie,
grey-zip-hoodie, blue-striped-tee; the 4 tees after them are kept but off.
- Wordmark: `public/products/unknown/brand/unknown-wordmark.svg`, traced from the supplied logo
  image (fill `#2C292A`). Swap for the brand's original vector file when you have it.
- Wall: pure white `#FFFFFF` (developer's new draft) with the Snug Wrld hero's pattern at the same
  scale and opacity: a 46 x 37px SVG tile of a small round hanger hook, 1px stroke `#151513` at 5%.
  The grey wall and the X-eyes pattern are retired. Hero only: every section below is plain white.
- Garment scale: `--garment-scale: 1.095` on `.unknown-showroom .rack` (default 1, so the Snug
  Wrld rack is unchanged).

## Round 9 (27 Oct 2026)

Scripts added: `scripts/check-paths.mjs` (Mac safety: no file names that differ only by case or
extension; every import matches its file letter for letter; run `node scripts/check-paths.mjs`),
`scripts/normalise-unknown-hanger.py`, `scripts/build-unknown-slides.py`,
`scripts/encode-unknown-slides.mjs`. QA artefacts: `reference/unknown/qa/round9/` (README there).

### Live store today (www.unk-nown.com, checked 27 Oct 2026)

The published theme has **no rack on desktop or on mobile**: header with the store menu, a banner
slideshow, then product carousels ("Tops" and so on). `0-live-site-today.jpg`. The detail view in
the client's comparison screenshot (UNKNOWN CAELUM JACKET with L / XL / XXL) is therefore not on
the published theme; it must come from an unpublished preview theme, which this sandbox can't open.
The developer's Shopify port of the rack lives on `main` (`shopify/`), not live.

### Desktop rack (`desktop-rack/`, 600px and up)

Same garments, hover turn, hover push and click-to-open as the shared rack (Snug Wrld's rack is
untouched); only the layout and scrolling are new.

| Measure | Value | 1024 × 768 | 1280 × 800 | 1440 × 900 | 1920 × 1080 |
|---|---|---|---|---|---|
| rail width | 74.5% of the viewport (unchanged) | 763 px | 954 | 1073 | 1430 |
| garment photo width | `min(36vh, 22.5vw)` × 1.095 (unchanged) | 252 | 315 | 355 | 426 |
| garment body width (side view, typical) | ≈ 0.27 photo widths, 9% of the rail | 68 | 85 | 96 | 115 |
| **pitch** (centre to centre) | **15.1% of the rail width** | 115.2 | 144.0 | 162.0 | 216.0 |
| **left start** | first garment's left edge = left bracket's inner face + **24px** (margin step); its centre sits 58 / 67 / 72 / 82 px inside the bracket | | | | |
| **bracket margin** | clip edges = the brackets' inner faces (14px inside each rail end) | | | | |
| garments fully on the rail | | 6 | 6 | 6 | 6 |
| **right peek** | the 7th garment's centre vs the right bracket | +15 px (a sliver) | +5 (half) | 0 (half) | −24 (most) |

- Interaction: mouse / pen drag (after 6px, horizontal only), touch drag (`touch-action: pan-y`),
  trackpad horizontal scroll (vertical wheel is never taken; Shift + wheel works), ← / → keys
  (the rack is focusable). Release glides with the phone rack's measured momentum (time constant
  100ms), then eases 300ms so a garment lines up with the left start; past either end it rubber-
  bands (0.35). No scrollbar (`.unknown-rack-wrap` is `overflow: hidden`).
- Clipping: at rest against an end nothing is clipped there (so a hovered garment's wider front may
  pass the bracket); once the row has moved off that end, garments are cut at the bracket.
- The detail view flies back to the garment's slot; on previous / next the rack first scrolls so
  that garment is fully on the rail (`reveal(i)`).
- Liquid: same markup as today's rack, plus `desktop-rack.css` and `desktop-rack-behaviour.js`
  (no settings).

### Detail view: Snug Wrld's, plus a size picker

Everything comes from the shared focus code with Snug Wrld's own values; UNKNOWN's earlier
overrides (12px corners, larger garment, higher hook, no link gap) are gone. Only differences: no
green ticker, a price line, the size row, and the link has no arrow.

Pixel differences vs Snug Wrld (measured in the browser, `2-detail-vs-snug-*.jpg`):

| | 1440 × 900 Snug | 1440 UNKNOWN | 390 × 844 Snug | 390 UNKNOWN |
|---|---|---|---|---|
| garment photo (x, y, w × h) | 518, 89, 405 × 540 | 517, 88, 405 × 540 (−1, −1) | 82, 108, 226 × 302 | 81, 107, 226 × 302 (−1, −1) |
| name | top 662, Archivo Black 24/32, −0.02em, uppercase | same | top 449, 20/24, 2 lines reserved | same |
| price line | – | 12/20 Archivo, 0.01em, #66645e, top 694 | – | top 497 |
| FRONT / BACK pill | 152 × 32, full radius, 1px ink, y 718 | same size / radius / border, y 738 (+20: price line) | y 521 | y 541 (+20) |
| size row | – | y 786: 48 × 32 pills, 8px apart | – | y 589 |
| "See availability" | y 774, 128 wide (with ↗) | y 842 (+68), 115 wide (no arrow) | y 577 | y 645 |
| prev / next | 48 × 48 circles (40px ring), x 86 / 1306, y 335 | same | x 23 / 319, y 744 | same |
| Close | 1341, 23, 67 × 48; Archivo 12px 500 0.08em ✕ | same (text box 1px lower) | 314, 20 | same |
| wall | grey #e9e8e4 + hook pattern | white + the same pattern (UNKNOWN's paper, kept) | | |
| rack behind | blur 8px, opacity 0.25, 500ms | same | | |
| motion in / out | shared FocusView springs | same code | | |

- The UNKNOWN header fades ABOUT and the wordmark out while the view is open (300ms), exactly as
  Snug's header does; Close sits at Snug's spot (2.2vw from the right, centred in a 10.4vh band).
- The info stack sits at Snug's stage depth (1.24857 × garment width) so the name, pill and link
  land at Snug's y; UNKNOWN's own deepest hem (1.2187) is shallower.
- **Price line kept**: one line under the name in Snug's secondary text style (its rack caption).
  Empty (but space kept) for garments with no store match.
- **Size picker** (`size-picker/`): pills shaped like the FRONT / BACK pill, between the pill and
  the link, `role="radiogroup"`, roving tab stop, ← → ↑ ↓ / Home / End move the selection (skipping
  unavailable sizes; the detail view's own arrow keys don't fire inside it), 48px targets, filled
  ink when selected, struck through + disabled when unavailable. Sizes = the product's "Size"
  option from `/products/<handle>.js` (snapshot in `lib/unknown-products.ts`, refreshed in the
  browser when the view opens; the store sends `Access-Control-Allow-Origin: *`, but a headless
  test browser was refused once, in which case the snapshot stays). Garments with no store match
  show L / XL / XXL flagged `sizesPlaceholder` (the radiogroup is labelled "sample sizes").
- "See availability" opens the store product page; with a size chosen it adds `?variant=<id>`.
  No link for garments without a store match (its space is kept).
- Liquid: price `{{ product.price | money }}`; sizes: loop `product.options_with_values` for the
  option named Size, and for each value find its variant (`product.variants | where: 'option1', value`
  or option2) → `data-variant-id`, `disabled` unless `variant.available`; link
  `{{ product.url }}?variant={{ variant.id }}`.

### Swipe hint (phones; `swipe-hint/`)

Copy, timings and switches in `swipe-hint.data.ts` (theme: section settings). Touch screens only
(`(hover: none), (pointer: coarse)`). Measured (390 × 844): page load event 0.3s; the hero counts
as settled after 0.4s on screen with the page loaded; nudge 0.69s → 1.20s (24px left, 240ms M3
emphasized decelerate out, 360ms emphasized back); label in at 1.87s (= nudge + 1.2s, 200ms fade);
out at 7.87s (6s); one repeat at 16.07s (8s idle after the fade): nudge + label for 3s; then
nothing. The first drag hides it at once; a drag that comes to rest on another garment stores
`unk-swipe-hint-done` (timestamp, try/catch) and the hint stays away for 30 days. Reduced motion:
no nudge, no chevron pulse, label for 5s once. Label: M3 Label Medium, #5c5c5c (6.6:1), centred
under the rack's caption (never over a garment), `pointer-events: none`, `aria-live="polite"`
(the text is filled only while shown, so it's announced once). Chevrons pulse 3px sideways (1.2s).

### White Tranquility jersey (8th garment)

UNKNOWN ORIGINAL TRANQUILITY JERSEY, ₦100,000, `/products/unknown-original-tranquility-jersey`,
sizes L / XL / 2XL (all available). Last on the rack via `position: 8` in `lib/unknown-products.ts`
(both racks and the detail view sort by it). Faces left in its side photo (print on the left
edge), so no mirror. Processing and the hanger normalisation (hook scaled ~15% to the others'
size, darker walnut colour-matched): `assets/products-src/unknown/PROCESSING.md`. Lettering
("TRANQUILITY", "unknown") checked against the store's photos: correct.

### Slides (`slides/`)

UNKNOWN F1 (`/products/unknown-f1-slide`), ₦100,000, one variant (Black): real store data. The
client's photo arrived at **1500 × 2000** (not the 3024 × 4032 original), so the pair is drawn
from that: cut out (BiRefNet), straightened (the pair's mean axis 2.1° → 0.9°; the two slides sit
3.3° apart so both can't be vertical), heels cut flat where they run off the photo and placed on
the panel's bottom edge, one baked contact shadow (silhouette blurred 22px, 12px down, 22%).
1x 640 × 800 (67 KB) / 2x 1280 × 1600 (171 KB). Strap: a 560 × 700 crop at the photo's own
resolution (71 KB; no 2x, there are no more pixels). Layout mirrors Two Piece: panel on columns
8–12 (expanded), 4–8 (medium), first when stacked; details beside it on the panel's lower edge.
Panel #f4f4f2, 12px radius. Eyebrow Label Medium, name Headline Medium, price Title Medium, one
"View product" link. Pair / Strap toggle (two 48px text buttons, `aria-pressed`) crossfades in
300ms (emphasized decelerate in / accelerate out). Tilt: hover + fine pointer only, ≤ 3°,
transform only, off for reduced motion.
- Liquid: settings `product` (product picker), `image_pair`, `image_strap` (image pickers), label
  text. `<img srcset="{{ image | image_url: width: 640 }} 1x, {{ image | image_url: width: 1280 }} 2x">`;
  price `{{ product.price | money }}`; link `product.url`. Load `slides-behaviour.js` once.

### Currency selector (`currency/`)

- The store's real list is **NGN only**: shop currency NGN; Markets has Canada, Nigeria and the
  United States, but every country checks out in NGN (cart.js stays NGN with `?country=US`,
  `?currency=USD` and the localization cookies) and products ship to NG only; the currency menu
  on the live site is a client-side converter app (Bucks), not Shopify currencies. So the selector
  ships with one row and no placeholders (`currency.data.ts`, `placeholder: false`).
- Desktop: "NGN ▾" (Label Medium, 16px chevron, 48px target) first in the right icon group, then a
  hairline divider, then search / account / cart. Popover: 12px radius, hairline border, M3
  elevation 2, 48px rows (name left, code right, check on the current one), max 6 rows then it
  scrolls. Listbox pattern: `aria-haspopup="listbox"`, `aria-expanded`, `aria-activedescendant`,
  ↑ ↓ Home End, first-letter type-ahead (repeat a letter to cycle), Enter / Space / click choose;
  Esc, Tab, outside click and choosing close it, focus back on the button. In 400ms emphasized
  decelerate, out 200ms emphasized accelerate.
- Compact: the last row of the hamburger panel, "Currency" left and the code right, expanding in
  place (the menu's own accordion) into radio rows.
- Kept in `localStorage` (`unk-currency`, try/catch); a stored code that isn't in the list falls
  back to NGN. No conversion, no rates.
- Header check: 1440 / 1280 / 1024 / 840 all fit with the centred wordmark (nearest gap at 840:
  wordmark ends 480, currency starts 600). Compact header unchanged (no desktop trigger there).
- Liquid: see the comment at the top of `currency-behaviour.js` (localization form, `country_code`,
  `localization.available_countries`, `localization.country.currency.iso_code`).

### Where Snug Wrld's values or plain numbers replace the token scale (round 9)

| Where | Value | Why |
|---|---|---|
| Detail view Close | Archivo 12px, 500, 0.08em, ✕ 13px 600, 10px gap, 2.2vw from the right | copy Snug exactly |
| Detail view pill, size pills, prev / next | full radius (999px / circle), not 12px | copy Snug exactly |
| Detail view price line | Archivo 12/20, 0.01em, #66645e | Snug's secondary text |
| Detail view size pills | Archivo 10px, 0.14em | same as Snug's FRONT / BACK labels |
| Detail view stack | 48px under the stage, 24px gaps, 16px pill to sizes | Snug's gaps (all on the 8px grid) |
| Desktop rack pitch | 15.1% of the rail width | layout ratio (see table) |
| Swipe hint chevrons | 12px glyph, 3px pulse, 1.2s | glyph motion, not spacing |
| Slides tilt | ≤ 3°, perspective 1200px | motion, not spacing |


## Still missing / placeholders

| What | Where | Needed |
|---|---|---|
| Pants photos with more torso | `assets/products-src/unknown/pants/` | the navel and ~15% bare torso above the waistband in all five, so the fade keeps 16 CSS px clear of the waistband on short screens too (see the pants HANDOFF, "Fade zone") |
| Left-facing side photo of the black jacket | `public/products/unknown/black-jacket-side.webp` | its sleeve lettering reads backwards when mirrored |
| Lookbook heading | `lookbook/lookbook.data.ts` | the client's chosen heading ("Off the rack" is the brief's example) |
| Developer's new draft hero (desktop + mobile screenshots) | hero | to compare the white header with icons pixel by pixel |
| Jackets collection | `header/header.data.ts` | the collection URL (the live store's own menu links Jackets to `#`) |
| Original vector logo | `public/products/unknown/brand/unknown-wordmark.svg` | the brand's SVG (current one is traced from a raster) |
| Lookbook product links | `lookbook/lookbook.data.ts` | which product each look shows (only 3 are linked) |
| Original slide photo | `assets/products-src/unknown/slides/` | the 3024 × 4032 file (only a 1500 × 2000 copy arrived); then `python3 scripts/build-unknown-slides.py && node scripts/encode-unknown-slides.mjs`, and a 2x strap |
| Currencies | `currency/currency.data.ts` | the store checks out in NGN only; if USD / CAD are wanted, enable them in Shopify Markets and list them here (or show placeholders: say which) |
| Store matches for 5 rack garments | `lib/unknown-products.ts` | orange bird vest, black jacket, green plaid shirt, ivory hoodie, grey zip hoodie: no certain store product, so no price / link and placeholder sizes. Beige panel jacket = CAELUM JACKET and blue striped tee = SHHSHHSH JERSEY are matched (names unchanged: say if they should take the store names) |
| Buying from the pants section | `pants-section/` | removed this round (View product instead); a size picker + cart call if wanted (see the pants HANDOFF) |

## Adding or replacing a pants photo

Photos must be the same model in the same pose, framing and size as `model-base.webp` (the brown
and cream ones were regenerated that way on 26 Oct 2026). Prompt (once per pair, the chinos photo
as the first reference image, the product photo as the second):

> Use the first image as the exact pose and framing reference. Keep the same model, the same
> arm position (arms hanging straight down at exactly the same angle, hands in exactly the same
> place beside the thighs), the same stance, the same white sneakers, the same crop, scale and
> camera height, the same lighting and the same plain white background. Output exactly
> 1086 × 1448 px. Change only the pants: replace the grey chinos with the exact [product] from the
> second image, keeping every graphic and detail exactly as in the product photo. Do not change the
> torso, arms, hands or framing.

Drop it into `assets/products-src/unknown/pants/` under the product's handle, run
`python3 scripts/build-unknown-pants-layers.py && node scripts/optimize-unknown-pants.mjs`, read
the checks it prints (registration, waistband, rebuild error) and copy the new boxes from
`aligned/layers.json` into `pants.data.ts`.

## Deploying a preview (Netlify, without touching production)

The Snug Wrld site on Netlify deploys `main` to production. Two safe ways to preview this branch:

**A. Branch deploy (if the Netlify site is connected to this GitHub repo)**
1. app.netlify.com → the Snug Wrld site → **Site configuration → Build & deploy → Branches and
   deploy contexts → Configure**.
2. Leave **Production branch** = `main`. Under **Branch deploys** choose **Let me add individual
   branches** and add `claude/dazzling-fermat-86yz78`. Save.
3. Push to the branch (or **Deploys → Trigger deploy** for it). The preview appears at
   `https://claude-dazzling-fermat-86yz78--snugwrld.netlify.app/unknown` (Netlify replaces `/`
   with `-` in branch names; the exact URL is shown on the deploy).

**B. Draft deploy from your Mac (no settings change)**
```bash
cd ~/Desktop/snug-wrld && git fetch origin && git checkout claude/dazzling-fermat-86yz78 && git pull
npm install
npx netlify-cli login                 # opens the browser once
npx netlify-cli link                  # pick the existing Snug Wrld site
npx netlify-cli deploy --build --alias unknown-preview
```
`deploy` without `--prod` is a **draft**: it never replaces the live site. It prints a URL like
`https://unknown-preview--snugwrld.netlify.app`; add `/unknown`. Never add `--prod`.

## Responsive (round 8)

Tested on the production build with Playwright device emulation (touch on, mobile viewport on
phones): 320 × 568, 360 × 740, 375 × 667, 390 × 844, 412 × 915, 430 × 932, 480 × 854, 600 × 960,
768 × 1024, 820 × 1180, 1024 × 768, 1180 × 820, 1280 × 800, 1440 × 900, 1920 × 1080, phones in
landscape 844 × 390 and 667 × 375, and the iPhone 13, Galaxy S5 and iPad (gen 7) presets. Screenshot
matrix per section: `reference/unknown/qa/round8/5-matrix-*.jpg`.

Results at every size: no sideways scroll; no clipped or cut-off text; every control 48 × 48 (the
hidden keyboard-only product chooser excepted: 48px when focused); the pinned pants: no text over
the model, the ghost or the header, at rest or mid-swap; every image file between 0.95x and 1.7x
its display size (device pixels).

| Defect found | Fix |
|---|---|
| Pinned stage used `100vh` fallbacks; feather, mist, lookbook and header heights in `vh` | `svh` only (dvh for the hero and the menu) |
| No safe-area handling (notch, home indicator) | `viewport-fit=cover`; margins, header, phone rack, pants bottom row and footer add the insets |
| A phone in landscape (667 × 375) got the stacked pants layout (chosen by width): the figure had a negative height | stacked layout chosen by shape (portrait); side by side in landscape |
| Short screens: the details and a pair did not both fit (landscape phones, 568-667px tall portrait phones) | name in Headline Small there; landscape details from the top; pants 246-345px tall on those screens |
| Phones in landscape got the desktop header, so no menu | the compact header (with the hamburger) also on touch screens up to 500px tall; the menu scrolls within the screen |
| `:hover` effects outside `@media (hover: hover)` (text links, footer, ABOUT, focus view controls): stuck hover on touch | all inside `@media (hover: hover)` |
| Wordmark link 18-28px tall; footer "Pants" / "About" 37-40px wide; ABOUT 46px wide | 48px link; invisible 48 x 48 hit boxes (checked with hit-tests 23px from each centre) |
| Lookbook product names cut off with an ellipsis (1280 and up) | they wrap; the underline follows each line |
| Lookbook photos 2.3-3x too large on desktop, 0.7x on landscape phones; desktop rack photos 2.4-2.8x on portrait tablets | `sizes` follow the real slots (the rack's `min(36vh, 22.5vw)`; the lookbook's clamp per photo ratio) |

Only on a physical device: Safari's collapsing address bar and toolbar (svh behaviour under real
scrolling), the real notch / Dynamic Island and home-indicator insets, momentum scrolling and
rubber-banding feel, real GPU frame times (this machine has no GPU), touch latency and the feel of
the rack's drag and sway, haptics, the landscape menu with a real on-screen keyboard (sign-up
field), browser extensions, and memory pressure on low-end Android.

## Verification (what was measured, and how)

### Round 9 (27 Oct 2026, production build)

Before = commit 5b72c93 (end of round 8) built and served on :3002, after = this branch on :3001,
same machine, same day. Artefacts: `reference/unknown/qa/round9/`.

- **Gates:** `npx eslint .` clean, `npx tsc --noEmit` clean, `npm run build` clean,
  `node scripts/check-paths.mjs` OK (631 files: no case / extension clashes, every import exact;
  it caught `Currency.tsx` vs `currency.css`, renamed to `currency-styles.css`). Hydration: no
  messages and 0 overlay issues at 1440 / 1024 / 768 / 390 / 360 (/unknown and Snug's /).
- **Every section** at 1440 / 1024 / 768 / 390 / 360: `gates-matrix-*.jpg`; horizontal overflow 0px
  at all five.
- **60 fps recordings** (headed Chromium on a virtual display, ffmpeg x11grab, **no GPU**), frames
  over 20 ms:
  - phone rack with the hint, first 8.5s from navigation (390): 0 of 493 after the load event
    (1 slow frame during the load itself); worst 16.8 ms. `hint-phone-390-60fps.mp4`.
  - detail view open → next → BACK → close: 390: 3 of 456 (worst 33 ms). 1440: 46-48 of ~445
    (33-50 ms frames in the hover turn, the open flight and the close flight). The round 8 build
    measures the same on this machine (46 and 48 in alternating runs): the blurred, full-size
    flight is software-rendered here; not a regression. `detail-view-{1440,390}-60fps.mp4`.
  - page scroll: phone 390: 1 of 1302. Desktop 1440: 28-35 of ~1090, all between scroll 400 and
    850 px (the hero → pants entry); the round 8 build gives 34 of 1000 in the same run (round 8's
    report of 1 / 1000 was a different machine state). `scroll-*-60fps.mp4`.
- **Lighthouse 12** (alternating builds): desktop 98 / 99 before, 98 / 99 after (LCP 1.0-1.1 s;
  CLS 0 before, 0.004 after: one garment layer, the ivory hoodie, reported only inside Lighthouse;
  no shift in the browser even with 4x CPU and slow network). Mobile before 90 / 84 / 84 / 87, after
  83 / 84 / 80 / 97 (LCP 2.3-5.1 s on both: simulated throttling dominates). Accessibility 100,
  best practices 100 on both.
- **Items:** desktop rack numbers, detail-view pixel differences and swipe-hint timings are in the
  Round 9 section above; size picker (L → XL → 2XL → wrap, variant ids in the link, reset per
  product), currency (Esc, outside click, choose, focus return, type-ahead, End scrolls, reload
  persistence and fallback) and Slides (toggle, aria-hidden, 1x at DPR 1, tilt) were driven in
  the browser.

### Round 8

All on the production build, round 8 (26 Oct 2026), unless marked dev. Before = commit b4146f6
(end of round 7) built and measured the same way on the same machine. Sheets, recordings and
reports: `reference/unknown/qa/round8/` (round 7's in `qa/round7/`).

- **Visit to footer (item 1):** white from the last Visit content to the footer's wall: before 0 px
  at all five widths; now 64 / 64 / 64 / 96 / 96 (360 / 390 / 768 / 1024 / 1440). Footer top
  padding 64 / 64 / 64 / 96 / 96 (section token).
- **Rack facing (item 2):** see `mirrorSide` above; flags unchanged; hooks unchanged (no geometry
  change since round 7's 0.2 px check).
- **Pants (items 3, 7):** exactly 1 pair link and 1 collection link at every position; tab order
  View product, previous, next, View all; View all on the counter's baseline (0 px); the link
  follows each pair 01-04; no overlaps (41 positions x 5 widths). Body identical across all five
  states (max 3 levels at 390). Fade vs waistband per width: see the pants HANDOFF.
- **Lookbook (item 4)**, frames over 20 ms / over 50 ms / frames / worst, three runs each:

  | Scroll | Before | After |
  |---|---|---|
  | dev server, cold, desktop 1512 @2x, up | 2/1/118/83, 20/1/128/83 | 4/0/129/33, 6/0/127/33 |
  | dev server, cold, desktop, down | 22/2/146/117, 20/3/156/83 | 3/0/146/33, 3/0/149/33 |
  | dev server, cold, phone @3x, up | 4/0/171/50, 8/0/130/50 | 5/0/100/50, 7/0/132/33 |
  | dev server, cold, phone, down | 8/1/175/67, 3/0/137/50 | 2/0/140/33, 2/0/140/33 |
  | production, desktop, down (over 20 ms / frames / worst) | 15/143/67, 3/140/33, 2/140/33 | 3/148/33, 2/144/33, 3/147/33 |
  | production, desktop, up (over 20 ms / frames / worst) | 4/122/33, 5/123/33, 4/121/33 | 2/128/33, 5/127/33, 4/133/33 |

  60 fps recordings of the lookbook scroll (up from the footer and back down): desktop 1 of 341
  frames over 20 ms (33 ms), phone 0 of 344.
- **Phone hero (item 6):** first load: every front photo at opacity 0 (360 / 390 / 430); after a
  drag and rest, the centre garment turns. Garments clipped at the 16px margins behind the
  brackets at both drag limits (`6ab-rack-load-and-limits.jpg`). Header measurements above.
- **Hydration (item 8, dev):** with an attribute added to `<html>` before hydration (as an
  extension does): before 1 issue at every width ("A tree hydrated but some attributes of the
  server rendered HTML didn't match"), after 0; without it, no hydration messages at 1440, 1024,
  768, 390, 360.
- **60 fps recordings** (headed Chromium on a virtual display, ffmpeg x11grab, no GPU): page scroll
  desktop 1 of 1000 frames over 20 ms, phone 0 of 1192; pants swaps 1440 3 of 519 (one 67 ms frame
  as the last pair releases), 390 0 of 536; phone rack 360 / 390 / 430: 2 / 1 / 4 of ~1160 (focus
  view open / close, one 50 ms frame on the first fling at 430, when the first front photos decode).
- **Lighthouse** (same machine, same day, alternating builds): desktop 98-99 for both before and
  after (LCP 0.9-1.1 s; round 7 measured 100 on another day); mobile before 80-86 (LCP 3.5-4.2 s,
  TBT 260-320 ms), after 80-84 (LCP 4.3-5.0 s, TBT 120-150 ms). The mobile LCP element is now the
  first garment's side photo (first load shows side views only); its render delay is longer.
  Accessibility 100, best practices 100. SEO 63 only because the prototype route is `noindex`.
- **Responsive:** see "Responsive" above.

## Quality notes

- Every interactive element has hover, focus-visible and pressed states (M3 state layers on buttons and cards, the drawn underline on text links); 48px targets; WCAG AA.
- Images have width/height (no layout shift), WebP; lazy below the fold except the pants model
  images (eager, see above).
- Checked at 1440, 1024, 768, 390 and 360px (phone rack also at 430). Known: at 768 portrait the
  existing desktop rack leaves the lower half of the screen empty (desktop rack layout unchanged).
