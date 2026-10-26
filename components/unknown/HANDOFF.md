# UNKNOWN homepage prototype (/unknown): handoff

A visual prototype of a new UNKNOWN homepage, built to be ported section by section to a Shopify
theme. Each section is self-contained: its own folder, plain CSS, a small plain-JS file where it
has behaviour, and a data file holding all copy, prices, images and links. No new libraries.

Page order: **Rack hero → Pants → New Arrivals → Two Piece → Caps → Lookbook → Visit + email → Footer.**
(The "Subtle Growth" drop band was removed.) Route: `app/unknown/page.tsx`.

## Files

| Section | Folder / files | Behaviour | Becomes in Liquid |
|---|---|---|---|
| Design tokens | `tokens.css` | – | theme base CSS variables (`assets/base.css`) |
| Shared section / link / button styles | `section.css` | – | part of `assets/base.css` |
| Text link ("View all", "View product", "Get directions") | `link/UnkLink.tsx` + `.unk-link` in `section.css` | CSS only | `snippets/unk-link.liquid` |
| Hero header + compact menu | `header/` (`UnknownHeader.tsx`, `header.data.ts`, `header-behaviour.js`, `header-styles.css`, `Icon.tsx`) | `header-behaviour.js` | `sections/unknown-header.liquid` (header group) |
| Rack hero, desktop | `UnknownShowroom.tsx`, `app/unknown/unknown.css`, `lib/unknown-products.ts`, `lib/unknown-brand.ts` | existing rack/focus code (your build) | `sections/unknown-hero.liquid` |
| Rack hero, phones (< 600px) | `mobile-rack/` (`MobileRack.tsx`, `mobile-rack-behaviour.js`, `mobile-rack-styles.css`) | `mobile-rack-behaviour.js` | inside `sections/unknown-hero.liquid` |
| Pants | `pants-section/` | `pants-section-behaviour.js` | `sections/unknown-pants.liquid` (see `pants-section/HANDOFF.md`) |
| New Arrivals | `new-arrivals/` | CSS only (hover) | `sections/unknown-new-arrivals.liquid` |
| Two Piece | `two-piece/` | CSS only | `sections/unknown-two-piece.liquid` (one product picker) |
| Caps | `caps/` | CSS only (hover) | `sections/unknown-caps.liquid` |
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
| Window classes | compact 0-599: 16 margin, 4 columns, 16 gutter. Medium 600-839: 24 margin, 8 columns, 24 gutter. Expanded 840+: 24 margin (32 from 1200), 12 columns, 24 gutter, centred 1440 max content width | `--margin`, `--columns`, `--gutter`, `--content-max` | Material 3 window size classes / layout |
| Top app bar | 64px tall on compact, 4px edge padding around 48px icon buttons | `.unk-header` | Material 3 top app bar |
| Type roles (size/line-height, weight) | Display L 57/64 · Headline L 32/40 · Headline M 28/36 · Headline S 24/32 · Title L 22/28 · Title M 16/24 (500) · Body L 16/24 · Body M 14/20 · Label L 14/20 (500) · Label M 12/16 (500) · Label S 11/16 (500); M3 tracking per role | `--type-*` (`font` shorthand) + `--track-*` | Material 3 type scale |
| Touch targets | 48 x 48 minimum | `--target` | Material 3 (meets Apple HIG 44pt and WCAG 2.2 2.5.8 target size) |
| State layers | hover 8%, focus 10%, pressed 10%, in the element's content colour | `--state-*`, `.unk-state` | Material 3 states |
| Focus ring | 2px solid ink, 2px offset (15:1 on white) | `--focus-ring`, `--focus-offset` | WCAG 2.2 2.4.13 focus appearance |
| Text contrast | AA everywhere: mute `#5c5c5c` 6.6:1 on white, 6.0:1 on the pants sky | colour tokens | WCAG 2.2 1.4.3 |
| Shape | 12px corners on buttons, inputs and containers (cards, wells, buy bar, menu panel) | `--radius-button` | brief |
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
| Pants price / intro line / counter / buy-bar name | Body Large / Body Medium / Label Medium / Label Medium |
| Text links, Add to cart, Sign up | Label Large, uppercase |
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
- **Compact (< 600px):** hamburger left (ABOUT moves into the menu), wordmark centred, the same
  three icons right. The wordmark takes the room left between the icon groups: 64-112px wide
  (78px at 390, 64px at 360, 112px from 424 up). With three 48px icons on the right that is the
  most a centred wordmark can have; moving search to the left of the wordmark would allow 112px.
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
| Rail | static, past both screen edges, 24px under the header | static; an end bracket 1.5vw in from each edge (not past the edges); centre 26vw under the header icons; ~1.3vw thick |
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
| Indicators | none | none (the dots under the reel belong to the reel itself) |

Implementation: pointer events, one `requestAnimationFrame` loop that runs only while something
moves and writes only `transform` / `opacity` (plus a z-index and the caption text when the centred
garment changes); layout is read on resize only. Vertical swipes scroll the page
(`touch-action: pan-y` + horizontal-intent detection, 6px). Each photo hangs by its own measured
hook loop (same geometry as `components/Garment.tsx`); every side view faces left (`mirrorSide`,
below). The first garment is server-rendered centred and facing front with its neighbours pushed
out, so the first paint needs no JavaScript (it is the mobile LCP image). Reduced motion: dragging
works, the row snaps without gliding, the swap and the gap are instant, nothing sways.
The focus view opens from the centred front view (`origin.bodyScale: 1`); when it closes, the rack
takes over on the side view and turns to the front after the usual 300ms rest (`resume()`).
**Liquid:** inside `sections/unknown-hero.liquid`, one `<li>` per garment block (side + front
image, `image_url` widths as the desktop rack); load `mobile-rack-behaviour.js` and call
`initMobileRack(el, { onSelect })`, where `onSelect(index, origin)` opens the focus view.

## Every garment faces left (`mirrorSide`)

Each side photo was checked one by one (which side the front placket, print or hood is on). The
**black jacket** and the **green plaid shirt** face right; the other five face left. Those two
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
  wrapper as pants).

**Visit + email** (`visit/`)
- Settings: address lines (text × 3), `hours` (text), `email_copy` (text, "Get exclusive deals and
  early access to new products").
- Form: wrap the same markup in `{% form 'customer', class: 'unk-signup' %}` with
  `<input type="hidden" name="contact[tags]" value="newsletter">`; show `form.posted_successfully?`
  and `form.errors` in the `[data-signup-msg]` line. Then `visit-behaviour.js` is no longer needed.
- `id="visit"` is kept as an anchor (the footer's "Visit the store" link).

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

## Still missing / placeholders

| What | Where | Needed |
|---|---|---|
| Pants photos with more torso | `assets/products-src/unknown/pants/` | all five regenerated with the navel and ~15% bare torso above the waistband, so one shared fade zone works (see the pants HANDOFF, "Fade zone") |
| Left-facing side photo of the black jacket | `public/products/unknown/black-jacket-side.webp` | its sleeve lettering reads backwards when mirrored |
| Lookbook heading | `lookbook/lookbook.data.ts` | the client's chosen heading ("Off the rack" is the brief's example) |
| Developer's new draft hero (desktop + mobile screenshots) | hero | to compare the white header with icons pixel by pixel |
| Jackets collection | `header/header.data.ts` | the collection URL (the live store's own menu links Jackets to `#`) |
| Original vector logo | `public/products/unknown/brand/unknown-wordmark.svg` | the brand's SVG (current one is traced from a raster) |
| Red sweatpant photo | `pants-section/pants.data.ts` (`hidden`) | the photo, generated in the base pose |
| Brown + cream photos in the base pose | `assets/products-src/unknown/pants/` | regenerated (arms differ: a second pair of hands can show for a moment mid-swap) |
| Lookbook product links | `lookbook/lookbook.data.ts` | which product each look shows (only 3 are linked) |
| Add to cart | pants buy bar | links to the current pair's product page (see the pants HANDOFF) |

## Regenerating the misaligned pants photos (brown, cream)

Prompt wording (run once per pair, with the chinos photo `assets/products-src/unknown/pants/model-base.webp`
as the first reference image and the product photo as the second):

> Use the first image as the exact pose and framing reference. Keep the same model, the same
> arm position (arms hanging straight down at exactly the same angle, hands in exactly the same
> place beside the thighs), the same stance, the same white sneakers, the same crop, scale and
> camera height, the same lighting and the same plain white background. Output exactly
> 1086 × 1448 px. Change only the pants: replace the grey chinos with the exact [brown logo
> sweatpant / cream lightning-crack jogger] from the second image, keeping every graphic and
> detail exactly as in the product photo. Do not change the torso, arms, hands or framing.

Then drop the result into `assets/products-src/unknown/pants/` under the same file name and run
`python3 scripts/prepare-unknown-pants.py && node scripts/optimize-unknown-pants.mjs`.

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

## Verification (what was measured, and how)

All on the production build. Sheets and recordings: `reference/unknown/qa/round6/`.

- **Section gaps** (content edge to content edge; components measured by their container, as in
  M3; script `reference/unknown/qa/round6/README.md`):

  | Gap | Before (1440 / 390) | After (1440 / 1024 / 768 / 390 / 360) |
  |---|---|---|
  | Hero > pants | transition: the pants section rises over the held hero (no gap) | unchanged |
  | Pants > New Arrivals | 403 / 347 | 96 / 96 / 64 / 64 / 64 |
  | New Arrivals > Caps | 224 / 160 | 96 / 96 / 64 / 64 / 64 |
  | Caps > Lookbook | 192 / 128 | 96 / 96 / 64 / 64 / 64 |
  | Lookbook > Visit | 255 / 177 | 96 / 96 / 64 / 64 / 64 |
  | Visit > footer | 205 / 156 | 96 / 96 / 64 / 64 / 64 |
- **Pants release:** scrolling slowly through the last swap, the stage stays pinned for 24px (1440)
  / 21px (390) after the last pair is fully on (the 0.1s scroll smoothing catching up), against
  300 / 282px before.
- **Pants crop fade:** reference 3.9% of the model's visible height (10-90% of the fade, sharpest
  frame of `video-b-full-reel.mov`; 5.6-5.9% on motion-blurred frames), body fully opaque below;
  ours was 8.0% plus a mist band over the waist, now 3.87% with the mist behind the model.
- **Phone rack** (390 x 844, touch emulation, synthetic drags / flings): drag 1:1 (100px finger =
  100px row), rubber band 150px pull = 51px (0.35) then back to 0, vertical swipe on the rack scrolls
  the page 285px with the rack still, tap on the centre opens the focus view, Close closes it; same at
  360 and 430; reduced motion: instant snap and turn. 60 fps recording with a frame-time log:
  1 of 1162 frames over 20ms in each of two runs (17 before the shadow was moved inside the card).
- **60 fps page scroll** (fresh load, headed Chromium on a virtual display, ffmpeg x11grab):
  phone-sized 0 of 1090 frames over 20ms. Desktop varies a lot with the recorder running on the
  same CPU (4 runs: 1-28 of 901; the previous build 6-48 of 1017 in 3 runs). Without the
  recorder, a fresh first pass through the hero and pants: 2 of 412 frames (previous build 0-5 of
  437). This machine has no GPU (software compositing), which is harsher than real devices.
- **Lighthouse:** desktop 98-100 performance, 100 accessibility, 100 best practices (LCP 0.8-1.1s,
  CLS 0-0.004). Mobile 81-84 / 100 / 100 (LCP 4.2-4.8s, the phone rack's first garment); the
  previous build measured 79-81 on the same machine the same day. SEO 63 only because the
  prototype route is `noindex` on purpose; the theme won't have that.
- **No sideways scroll** at 1440, 1024, 768, 390 and 360 (real mobile emulation below 800).
- **Console / hydration:** no errors, warnings or hydration messages from our code at 1440, 1024,
  768, 390, 360 (dev server; the Next dev overlay shows no issues).
- **Hero vs draft:** the rack (rail, hanger spacing, garment order and scale, shadows) is unchanged
  from the last verified match to the draft (rail within 1-3px, logo within 2-4px at 1440). The
  developer's new draft screenshot did not reach the build, so the white-wall header with icons
  could not be compared pixel by pixel.

## Quality notes

- Every interactive element has hover, focus-visible and pressed states (M3 state layers on buttons and cards, the drawn underline on text links); 48px targets; WCAG AA.
- Images have width/height (no layout shift), WebP; lazy below the fold except the pants model
  images (eager, see above).
- Checked at 1440, 1024, 768, 390 and 360px (phone rack also at 430). Known: at 768 portrait the
  existing desktop rack leaves the lower half of the screen empty (desktop rack layout unchanged).
