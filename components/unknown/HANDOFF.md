# UNKNOWN homepage prototype (/unknown): handoff

A visual prototype of a new UNKNOWN homepage, built to be ported section by section to a Shopify
theme. Each section is self-contained: its own folder, plain CSS, a small plain-JS file where it
has behaviour, and a data file holding all copy, prices, images and links. No new libraries.

Page order: **Rack hero → Pants → New Arrivals → Subtle Growth drop band → Caps → Visit + email
→ Footer.** Route: `app/unknown/page.tsx`.

## Files

| Section | Folder / files | Behaviour | Becomes in Liquid |
|---|---|---|---|
| Design tokens | `tokens.css` | – | theme base CSS variables (`assets/base.css`) |
| Shared header/link/flag styles | `section.css` | – | part of `assets/base.css` |
| Rack hero | `UnknownShowroom.tsx`, `app/unknown/unknown.css`, `lib/unknown-products.ts`, `lib/unknown-brand.ts` | existing rack/focus code (your build) | `sections/unknown-hero.liquid` |
| Pants | `pants-section/` | `pants-section.js` | `sections/unknown-pants.liquid` (see `pants-section/HANDOFF.md`) |
| New Arrivals | `new-arrivals/` | CSS only (hover) | `sections/unknown-new-arrivals.liquid` |
| Drop band | `drop-band/` | `drop-band.js` | `sections/unknown-drop-band.liquid` |
| Caps | `caps/` | CSS only (hover) | `sections/unknown-caps.liquid` |
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
- **Shape:** radius 2px; 1px hairlines; 44px minimum targets.
- **Motion:** one easing family (cubic ease-out `cubic-bezier(.22,.61,.36,1)`, ease-in, ease-in-out)
  and three durations (160 / 320 / 640 ms). Scroll motion only in the pants section and the drop
  band; reveals are a once-only 16px fade-up.

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

The hero header keeps the existing build's font (Archivo) at 12px uppercase; at that size the two
read the same.

## Sections in Liquid

**Pants:** see `pants-section/HANDOFF.md` (product blocks + model image per block).

**New Arrivals** (`new-arrivals/`)
- Settings: `label` (text, "Just in"), `title` (text, "New Arrivals"), `collection`
  (collection picker → **`new-arrival`**), `limit` (range 4–12, default 8).
- Markup: `{% for product in section.settings.collection.products limit: section.settings.limit %}`;
  first image = `product.featured_image`, hover image = `product.images[1]` (skip the hover layer
  if there is none); price `{{ product.price | money }}`; link `product.url`; "View all" →
  `section.settings.collection.url`.
- Prototype data is **placeholder** (rack photos under working names, no prices) and flagged on
  screen; the flag disappears once real products are wired.

**Drop band** (`drop-band/`)
- Settings: `label` (text), `title` (text, "Subtle Growth"; split on the first space into two
  lines), `link_text`, `link_url` (url; currently `/collections/new-arrival` until the drop has
  its own collection).
- JS: `initDropBand(sectionEl)` (custom element as for pants; only runs while the band is on screen).

**Caps** (`caps/`)
- Settings: `label` ("Headwear"), `title` ("Caps"), `intro` (richtext, optional, **no copy
  invented**), `collection` (collection picker: **caps/headwear handle not confirmed**).
- Blocks: type `cap`, limit 3, setting `product`; first block renders large. Or use the first 3
  products of the collection when no blocks are set.
- Prototype data is **all placeholder** (no cap photos could be fetched), flagged on each tile.

**Visit + email** (`visit/`)
- Settings: address lines (text × 3), `hours` (text), `email_copy` (text, "Get exclusive deals and
  early access to new products").
- Form: wrap the same markup in `{% form 'customer', class: 'unk-signup' %}` with
  `<input type="hidden" name="contact[tags]" value="newsletter">`; show `form.posted_successfully?`
  and `form.errors` in the `[data-signup-msg]` line. Then `visit.js` is no longer needed.
- `id="visit"` is the target of the header's CONTACT link.

**Footer** (`footer/`): menus from `linklists` (Shop: New arrivals, Pants, All products;
UNKNOWN: About, Visit the store), address + hours from the same settings as Visit.

**Hero** (`UnknownShowroom.tsx`): ABOUT/CONTACT text links, wordmark as an image setting
(`image_picker`, SVG), garments as blocks (one per garment with front/side/back images). The
`on` flag in `lib/unknown-products.ts` = whether a block is present.

## Placeholders still in the prototype

| What | Where | Needed |
|---|---|---|
| UNKNOWN wordmark | `public/products/unknown/brand/unknown-wordmark.svg` | real logo file from the draft (SVG); update width/height in `lib/unknown-brand.ts` |
| Draft's 7 garments + order | `lib/unknown-products.ts` (`on` flags) | the draft screenshot or the list; all 11 are on until then |
| New Arrivals products | `new-arrivals/new-arrivals.data.ts` | real products from `/collections/new-arrival` (names, ₦ prices, URLs, images) |
| Caps products + collection handle | `caps/caps.data.ts` | real cap products/photos and the collection URL |
| Red sweatpant photo | `pants-section/pants.data.ts` (`hidden`) | the photo, regenerated in the base pose |

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

## Quality notes

- Every interactive element has hover, focus-visible and active states; 44px targets; WCAG AA.
- Images have width/height (no layout shift), lazy-load below the fold, WebP.
- Checked at 1440, 1280, 1024, 768 and 390px. Known: at 768 portrait the existing rack hero
  leaves the lower half of the screen empty (rack layout is unchanged from your build).
