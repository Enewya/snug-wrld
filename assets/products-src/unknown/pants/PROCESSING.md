# UNKNOWN pants-section photos

Generated model photos, all of one model in one pose on a plain white background, 1086 × 1448 (3:4).
Kept byte-for-byte as supplied, renamed to the file names the section expects:

| File | Photo |
|---|---|
| `model-base.webp` | grey chinos: the neutral in-between state, not a product |
| `unknown-denim-jean.webp` | olive washed denim |
| `unknown-side-eye-baggy-pant.webp` | grey wide sweatpant with curved seams |
| `unknown-logo-sweatpant-brown.webp` | brown logo sweatpant, wide leg (regenerated in the base pose, 27 Oct 2026) |
| `unknown-lgt-strikes-joggers.webp` | cream sweatpant with the lightning-crack graphic (regenerated in the base pose, 26 Oct 2026) |
| `unknown-logo-sweatpant-red.webp` | red logo sweatpant, wide leg (generated in the base pose, 27 Oct 2026) |
| `previous/unknown-logo-sweatpant-brown.webp` | the earlier brown photo (26 Oct). Not shown; still one of the four photos the body layer is built from (with its mask in `previous/masks/`) |

## Pipeline

```
python3 scripts/build-unknown-pants-layers.py   # masks/ (subject masks), aligned/ (layers + checks)
node scripts/optimize-unknown-pants.mjs         # public/products/unknown/pants-layers/*.webp
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

## Body references (round 10)

The body and hands layers come from four fixed photos (`BODY_REFS` in the script: denim, side eye,
the previous brown, LGT), so adding or replacing a pair never changes them: after adding red and
replacing brown, `body.png`, `hands.png`, the base and the other three pairs (colour and grey) are
pixel-identical to the previous run. A pair outside the references (now brown and red) gets two
extra clean-ups, because a separately generated photo's skin and shoes differ from the base's by more
than the "same pixel" threshold: within 40 px of its waistband, pixels closer in colour to the base's
skin there than to the pair's fabric are dropped (skin); in the shoe zone, neutral pixels
(chroma < 8, L* > 30) are dropped (shoe leather, laces, its shadows). Only for clearly coloured
fabric (chroma > 20), so a cream or grey pair would need its own check.

## Last run (27 Oct 2026)

| Photo | Registration | Waistband top (px) | Rebuild: mean / px > 40 |
|---|---|---|---|
| base chinos | (the base) | 104 | 1.0 / 0.41% |
| denim | already on the base | 109 | 2.5 / 0.60% |
| side eye | scale 0.983, shift −9.9, −1.2 px | 104 | 2.7 / 0.83% |
| brown (new, wide leg) | already on the base | 102 | 3.5 / 1.08% |
| red (new, wide leg) | scale 1.001, shift 0.5, −1.7 px | 102 | 2.8 / 0.89% |
| cream (LGT) | scale 1.001, shift 0.5, −1.2 px | 100 | 2.5 / 0.47% |

Fade unchanged: 0–35 px, 65–74 px above every waistband (red and brown 67). Brown and red each have
~2,500 px (0.2% of the figure) of shoe top that the base chinos covered and their hems don't; those
show the page's white right under the hem (white shoe on white: no visible edge). After the clean-ups, shoe-coloured
pixels left in the hems: red 2, brown 0; skin-hued pixels at red's waist: 66 (its edge). Brown can't
be checked by colour (its fabric is skin-toned): checked by eye at 2x on black, no skin above the
waistband (`reference/unknown/qa/round10/3-cutouts-*.jpg`).

## Previous run (26 Oct 2026)

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
