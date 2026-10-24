# UNKNOWN pants-section photos

Generated model photos, all of one model on a plain white background, 1086 × 1448 (3:4). Kept
byte-for-byte as supplied, renamed to the file names the section expects:

| File | Photo |
|---|---|
| `model-base.webp` | grey chinos: the neutral in-between state, not a product |
| `unknown-denim-jean.webp` | olive washed denim |
| `unknown-side-eye-baggy-pant.webp` | grey wide sweatpant with curved seams |
| `unknown-logo-sweatpant-brown.webp` | brown logo sweatpant |
| `unknown-lgt-strikes-joggers.webp` | cream sweatpant with the lightning-crack graphic |
| `unknown-logo-sweatpant-red.webp` | not supplied yet (the red pair is switched off in `pants.data.ts`) |

## Pipeline

```
python3 scripts/prepare-unknown-pants.py    # cut/ (cut-outs), then aligned/ (aligned + common crop)
node scripts/optimize-unknown-pants.mjs     # public/products/unknown/pants/*.webp (< 200 KB each)
```

`prepare-unknown-pants.py` needs `pip install "rembg[cpu]" pillow numpy`; the first run downloads
the BiRefNet model (~1 GB). See the script header for how each step works. In short:

1. **Cut-out**: rembg's BiRefNet subject mask (Linux-friendly; `scripts/cutout.mjs` needs macOS
   Vision). The shoe shadows are removed with the backdrop.
2. **Align**: each pair is scaled and moved onto `model-base`, using the torso width for scale,
   the shoe soles for height and the torso centre for x.
3. **Common crop**: everything is cropped to the area all photos cover, then written back at
   1086 × 1448.

To replace a photo, drop the new one in here under the same name and run both commands.

## Alignment at the last run

| Photo | Scale | Note |
|---|---|---|
| denim | 0.998 | Matches the base |
| grey wide | 0.984 | Hands a few px off: barely visible in the cross-fade |
| brown | 0.947 | Arms at a different angle: visible second pair of hands mid-swap |
| cream | 0.857 | Framed 16% tighter; arms and stomach differ: clearly doubled mid-swap |

Brown and cream are to be regenerated in the exact base pose. The common crop currently trims
129 px off the top (because of the cream photo); with matching photos it shrinks to almost nothing.
