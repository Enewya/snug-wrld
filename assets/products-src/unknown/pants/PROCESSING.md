# UNKNOWN pants-section photos

Generated model photos, all of one model in one pose on a plain white background, 1086 × 1448 (3:4).
Kept byte-for-byte as supplied, renamed to the file names the section expects:

| File | Photo |
|---|---|
| `model-base.webp` | grey chinos: the neutral in-between state, not a product |
| `unknown-denim-jean.webp` | olive washed denim |
| `unknown-side-eye-baggy-pant.webp` | grey wide sweatpant with curved seams |
| `unknown-logo-sweatpant-brown.webp` | brown logo sweatpant (regenerated in the base pose, 26 Oct 2026) |
| `unknown-lgt-strikes-joggers.webp` | cream sweatpant with the lightning-crack graphic (regenerated in the base pose, 26 Oct 2026) |
| `unknown-logo-sweatpant-red.webp` | not supplied yet (the red pair is switched off in `pants.data.ts`) |

## Pipeline

```
python3 scripts/build-unknown-pants-layers.py   # masks/ (subject masks), aligned/ (layers + checks)
node scripts/optimize-unknown-pants.mjs         # public/products/unknown/pants/*.webp
```

`build-unknown-pants-layers.py` needs `pip install "rembg[cpu]" pillow numpy scipy`; rembg only
makes the subject masks in `masks/` (cached; the first run downloads the BiRefNet model, ~1 GB). The
script header explains each step. In short, the section is built from layers on one fixed canvas:

| Layer | File | From |
|---|---|---|
| L0 body (torso, arms, shoes) | `aligned/body.png` | every pixel that is the same in the photos (no colour test), plus the few spots only one photo shows; one shared top fade |
| L1 pants, one per state | `aligned/<name>.png`, grey copy `<name>-grey.png` | each photo minus the body; filled in under the hands (texture mirrored in from the side) |
| L2 hands | `aligned/hands.png` | the base's arms below the chest, edges matted against the chinos |

Checks written by every run (`aligned/layers.json`): registration per photo, waistband per pants,
the fade zone, and how closely body + pants + hands rebuild each original photo (mean difference
and the share of pixels more than 40 levels off). `aligned/contact-sheet.jpg`: each pants on a
checkerboard, the composite and the original, plus the body, the hands and a 50% overlay of all
composites.

## Last run (26 Oct 2026)

| Photo | Registration | Waistband top (px) | Rebuild: mean / px > 40 |
|---|---|---|---|
| base chinos | (the base) | 104 | 1.0 / 0.41% |
| denim | already on the base | 109 | 2.5 / 0.60% |
| side eye | scale 0.983, shift −9.9, −1.2 px | 104 | 2.7 / 0.83% |
| brown | already on the base | 99 | 2.7 / 0.66% |
| cream (LGT) | scale 1.001, shift 0.5, −1.2 px | 100 | 2.5 / 0.47% |

Shared fade on the body: 0–35 px (ends 64 px, 16 CSS px at 360 wide, above the highest waistband).
Known limits, all hidden at rest and only in the moving copy: the hem's bottom edge carries a 1–3 px
trace of the shoe beneath it, and where a hand rests on the fabric the hand's soft shadow stays on
the fabric (it slides 2% of the frame with the outgoing pair while that pair fades).

To replace a photo, drop the new one in here under the same name (same model, pose, framing) and
run both commands; the checks say whether it still lines up.
