# UNKNOWN homepage prototype (/unknown): handoff

A visual prototype of a new UNKNOWN homepage, built to be ported section by section to a Shopify
theme. Each section is self-contained: its own folder, plain CSS, a small plain-JS file where it
has behaviour, and a data file holding all copy, prices, images and links. No new libraries.

Page order: **Rack hero → Pants → New Arrivals → Caps → Lookbook → Visit + email → Footer.**
(The "Subtle Growth" drop band was removed.) Route: `app/unknown/page.tsx`.

## Files

| Section | Folder / files | Behaviour | Becomes in Liquid |
|---|---|---|---|
| Design tokens | `tokens.css` | – | theme base CSS variables (`assets/base.css`) |
| Shared header/link/button styles | `section.css` | – | part of `assets/base.css` |
| "View product ↗" link | `link/UnkLink.tsx` + `.unk-link` in `section.css` | CSS only | `snippets/unk-link.liquid` |
| Rack hero | `UnknownShowroom.tsx`, `app/unknown/unknown.css`, `lib/unknown-products.ts`, `lib/unknown-brand.ts` | existing rack/focus code (your build) | `sections/unknown-hero.liquid` |
| Pants | `pants-section/` | `pants-section.js` | `sections/unknown-pants.liquid` (see `pants-section/HANDOFF.md`) |
| New Arrivals | `new-arrivals/` | CSS only (hover) | `sections/unknown-new-arrivals.liquid` |
| Caps | `caps/` | CSS only (hover) | `sections/unknown-caps.liquid` |
| Lookbook | `lookbook/` | `lookbook.js` (arrow buttons) | `sections/unknown-lookbook.liquid` |
| Visit + email | `visit/` | `visit.js` (prototype submit) | `sections/unknown-visit.liquid` |
| Footer | `footer/` | – | `sections/footer.liquid` (theme footer group) |
| Reveal on scroll | `reveal/` | `reveal.js` | `assets/unknown-reveal.js`, loaded once in `theme.liquid` |

## Design system (tokens.css)

- **Colour:** ink `#151515`, paper `#fff`, warm wall `#e9e8e4`, mute `#5c5c5c` (6.6:1 on white,
  5.3:1 on warm: AA), hairline `rgba(21,21,21,.12)`, image well `#f4f4f2`.
- **Type:** one family, Hanken Grotesk 400/500. Scale: 11 (labels, uppercase, +0.14em), 13, 15,
  20–26, 28–46 (product names, ~3vw as measured from the reference), 40–104 (statements).
- **Space:** 8-pt scale 4/8/16/24/32/48/64/96/128; gutter `clamp(16px, 4.17vw, 64px)`; max
  content width 1440.
- **Shape:** `--radius-button: 12px` for every button, input and button-like control (arrows,
  Add to cart, sign-up field + button, focus rings), and the same 12px for cards/media. Nested
  shapes are concentric: the pants buy bar is 12 + 8 = 20px around its 12px button. 1px
  hairlines; 44px minimum targets.
- **Backgrounds:** the hero alone carries the pattern; every section below is plain `#FFFFFF`
  (the pants sky fades back to white through `.unk-pants-tail`).
- **Motion:** one easing family (cubic ease-out `cubic-bezier(.22,.61,.36,1)`, ease-in, ease-in-out)
  and three durations (160 / 320 / 640 ms). Scroll motion only in the pants section; reveals are a
  once-only 16px fade-up.
- **Links:** one style everywhere ("View product", "View all", "Get directions"): text + ↗ arrow,
  6px gap, a 1px underline under the text only; on hover the underline draws in left to right and
  the arrow nudges 2px up-right (off with reduced motion).

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

The hero header keeps the existing build's font (Archivo), uppercase, tracked 0.08em, at
`clamp(12px, 0.9vw, 18px)` (13px at 1440, as in the draft); at that size the two read the same.

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
- "View all ↗" → `/collections/new-arrival`.

**Caps** (`caps/`)
- Settings: `label` ("Headwear"), `title` ("Caps"), `collection` (collection picker →
  **`headwear`**).
- Blocks: type `cap`, limit 4, setting `product`. Prototype shows exactly these four, real data
  and photos from the store: UNKNOWN SV SNAPBACK RED ₦70,000, UNKNOWN VRS ₦100,000, UNKNOWN SV
  SNAPBACK BLACK ₦70,000, UNKNOWN FUR CLOUD BEANIE ₦80,000. Hover image = `product.images[1]`
  where one exists. 4 across on desktop, 2 across on phones.
- "View all ↗" → `/collections/headwear`.

**Lookbook** (`lookbook/`)
- Photos: 14 looks from `/pages/unknown-lookbook` (store originals in `reference/lookbook/`,
  web versions in `public/products/unknown/lookbook/`).
- Settings: `label`, `title` ("Lookbook"), `link_url` (→ `/pages/unknown-lookbook`, "View all ↗").
- Blocks: type `look`, settings `image` (image_picker) and optional `product` (product picker).
  Caption is "Look {{ forloop.index | prepend: '0' }}"; when a product is set, its name + ↗ link
  shows on hover (always visible on touch screens). Only looks 04, 05 and 08 have a product in the
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
  and `form.errors` in the `[data-signup-msg]` line. Then `visit.js` is no longer needed.
- `id="visit"` is the target of the header's CONTACT link.

**Footer** (`footer/`): menus from `linklists` (Shop: New arrivals, Pants, All products;
UNKNOWN: About, Visit the store), address + hours from the same settings as Visit.

**Hero** (`UnknownShowroom.tsx`): ABOUT left / CONTACT right, wordmark as an image setting
(`image_picker`, SVG), garments as blocks (one per garment with front/side/back images). The
`on` flag in `lib/unknown-products.ts` = whether a block is present: on, in draft order,
beige-panel-jacket, orange-bird-vest, black-jacket, green-plaid-shirt, ivory-hoodie,
grey-zip-hoodie, blue-striped-tee; the 4 tees after them are kept but off.
- Wordmark: `public/products/unknown/brand/unknown-wordmark.svg`, traced from the supplied logo
  image (fill `#2C292A`). Swap for the brand's original vector file when you have it.
- Wall: `#E9E8E4` (sampled from the draft) with the hero-only pattern: a 240px SVG tile of two
  small "X-eyes" faces (UNKNOWN's mark language), stroke `#151515` at 6.5% opacity. Candidates
  compared in `reference/draft-hero/pattern-candidates.png`.
- Garment scale: `--garment-scale: 1.095` on `.unknown-showroom .rack` (default 1, so the Snug
  Wrld rack is unchanged).

## Still missing / placeholders

| What | Where | Needed |
|---|---|---|
| Original vector logo | `public/products/unknown/brand/unknown-wordmark.svg` | the brand's SVG (current one is traced from a raster) |
| Red sweatpant photo | `pants-section/pants.data.ts` (`hidden`) | the photo, generated in the base pose |
| Brown + cream photos in the base pose | `assets/products-src/unknown/pants/` | regenerated (arms differ: a second pair of hands can show for a moment mid-swap) |
| Lookbook product links | `lookbook/lookbook.data.ts` | which product each look shows (only 3 are linked) |
| Add to cart | pants buy bar | links to the product page; real cart needs a size picker |

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

- **60 fps recordings** (fresh load, production build): headed Chromium on a virtual display,
  ffmpeg x11grab at 60 fps, continuous trackpad-like scroll through the whole page, plus an
  in-page frame-time log. Desktop 1440×900: 2 of 1017 frames over 20 ms (33 ms each), none over
  50 ms. Phone 390×844: 0 of 1197. Entry only (6 passes): 1 of ~870 over 20 ms. This machine has
  no GPU (software compositing), which is harsher than real devices.
- **What keeps it smooth:** greys, top fade and clouds baked into images (no CSS filter / mask /
  blur); hero held with sticky instead of moved; one rAF loop writing only transform/opacity;
  decode + one invisible warm-up draw before the first scroll.
- **Hero vs draft** at 1440 wide (draft content area vs our 1440×800 viewport): wall colour exact;
  logo, ABOUT, CONTACT within 1–4 px; rail ends within 1 px, top 3 px lower. Garments: same
  order, hanger spacing and scale; the vest and striped tee read narrower than in the draft
  because the draft used more-turned side photos. Sheets in `reference/unknown/qa/`.
- **Console:** no errors or warnings at 1440 and 390 (the dev overlay's "1 Issue" was Next's LCP
  warning for lazy-loaded pants images; they now load eagerly).

## Quality notes

- Every interactive element has hover, focus-visible and active states; 44px targets; WCAG AA.
- Images have width/height (no layout shift), WebP; lazy below the fold except the pants model
  images (eager, see above).
- Checked at 1440, 1280, 1024, 768 and 390px. Known: at 768 portrait the existing rack hero
  leaves the lower half of the screen empty (rack layout is unchanged from your build).
