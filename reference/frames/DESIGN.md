# SNUG WRLD — Design Spec (STRICT)

Primary reference: `reference/frames/batch-merch/*.jpg` (Batch Merch by @cambreedesigns).
Secondary reference: `reference/frames/anjaa/*.jpg` (ANJAA recreation) — focus-view details only.
Approved component prototype: `reference/snug-rack-lab.html` (hanger, drag physics, swing tags, dye-dip).

Open and study EVERY frame before writing code. When this doc and the frames disagree, the frames win.
Do not invent sections, hero banners, extra pages, gradients, cards or icons that are not in the frames.

---

## 1. Page shell (match Batch Merch exactly)
- One screen, no page scroll on desktop. Content sits in a centred panel with generous margins.
- Background: light warm grey (#e9e8e4 range) with a very faint repeating pattern of small
  hanger/hook outline icons in a loose grid (barely visible, ~4–6% contrast). See batch-merch frames.
- Header row:
  - Left: `ABOUT` (small uppercase, ~12px, letter-spaced, dark navy/ink).
  - Centre: logo `public/snug-wrld-logo.png` (height ~48px, sharp).
  - Right: `CONTACT` (same style as ABOUT).
- Bottom: full-width marquee band. Batch Merch uses a navy band with italic uppercase white text.
  SNUG version: band = electric green #14ef1c, text = purple #6a1f78, italic, uppercase, bold,
  ~14px, letter-spaced. Text: `IT'S US, NEVER THEM  •  NEW DROPS  •  LAGOS  •` looping forever, slow.
- `SEE AVAILABILITY` outlined pill button centred below the rack (thin 1px ink border, uppercase
  ~12px, generous horizontal padding). Links to https://checkout.snugwrld.com/

## 2. The rack (home view) — THE signature piece
- Horizontal chrome rail spanning ~65% of the panel width, positioned in the upper-middle.
  Rendered as a polished metal tube (linear gradient: dark grey → near-white highlight → grey)
  with a mounting bracket/end cap at each end. See batch-merch frames for exact look.
- Garments hang from the rail on hangers. Each hanger = thin chrome wire hook over the rail
  + walnut-wood hanger body. On the rack you see the hanger mostly edge-on (narrow wooden
  block below the hook), exactly like the frames.
- Resting state: every garment hangs SIDE-ON (rotateY ≈ 72–80deg), packed closely, like a
  real clothes rack. Slight random variation in hang (±1deg rotateZ) so it feels physical.
- Product order and count: all products in the data file (currently 2: Crimson Memory LS Shirt,
  It's Us Never Them Tee). Leave the layout able to handle 4–10 items.
- Hover a garment (desktop):
  - It swings round to face the viewer (rotateY → 0) with a spring + small pendulum overshoot
    pivoting from the hook (transform-origin at the hook).
  - It scales up ~1.12 and comes forward (z-index above neighbours).
  - Neighbours slide apart to make room (left ones shift left, right ones shift right).
  - Its name fades in centred under the rail area in small grey text: `Name — Colour`
    (e.g. `Crimson Memory LS Shirt — White`). Exactly like "Made This Tee — Black" in the frames.
  - Mouse out: swings back to side-on.
- Click a garment → opens the focus view (section 3) with a shared-layout transition
  (framer-motion layoutId) so the garment flies from the rack to the centre.

## 3. Focus view (Batch Merch frames 7–8 + ANJAA + the prototype)
- The rack fades out; the selected garment is centred, large, facing front, on its hanger.
- Previous/next garments are ghosted on either side: blurred, low opacity.
- Circular outline arrow buttons ← → at mid-height left and right. Arrow keys work too.
  Switching: outgoing garment turns to side profile, incoming turns in (as in prototype).
- `CLOSE ✕` top right returns to the rack (reverse layout transition).
- Under the garment, centred, in this order (sizes from the prototype):
  1. `DRAG TO ROTATE` — tiny grey uppercase, letter-spaced.
  2. `01 / 02` counter — tiny grey.
  3. Product name — heavy black condensed uppercase (Archivo Black), ~24px desktop. Black only.
  4. Colour label (only if the product has colourways) — tiny uppercase.
  5. FRONT / BACK pill toggle (black knob slides; follows drag progress live).
  6. `SEE AVAILABILITY ↗` — underlined text link, small uppercase.
- Drag left/right on the garment to rotate it (spring physics from prototype). Products without
  a back image resist and spring back; the BACK button still shows and only makes it sway.
- Colourways (It's Us tee: Jet / Bubblegum / Lagos Sun): swing tags hanging on strings beside
  the garment; selecting one runs the dye-dip transition from the prototype and tints the
  background 9% toward that colour.

## 4. Hanger (non-negotiable)
- Copy the prototype hanger: walnut neck + chrome hook with collar bar.
- The hanger sits BEHIND the garment inside the shirt; only the wooden neck arch and the hook show
  above the collar. The hanger arms must NEVER be visible over or outside the shoulders.
- It turns with the garment.

## 5. Mobile (<640px)
- No hover. The rack becomes a horizontal snap-scroll; the centred garment automatically turns
  to face front and shows its name. Tap opens the focus view.
- Focus view: garment ~60vw, swing tags tucked beside it, arrows at the bottom corners.
- Marquee and SEE AVAILABILITY stay.

## 6. Data
`lib/products.ts`, typed:
```ts
type Colourway = { label: string; hex: string; front: string; back?: string };
type Product = { slug: string; name: string; colour?: string; front: string; back?: string;
                 colourways?: Colourway[]; url: string };
```
- crimson-memory: front + back, colour "White".
- its-us-tee: colourways jet / bubblegum / lagos-sun (front only).

## 7. Quality bar
- Respect prefers-reduced-motion (crossfades instead of springs/dye).
- Images via next/image with priority on the rack.
- No layout shift; no console errors; Lighthouse performance ≥ 90 on desktop.
- After each phase, run `npm run build` and fix every error before stopping.
