"""Prepares the UNKNOWN pants-section model photos: cut-out, align to the base, common crop.

    python3 scripts/prepare-unknown-pants.py        (then: node scripts/optimize-unknown-pants.mjs)
    needs: pip install "rembg[cpu]" pillow numpy    (first run downloads the ~1 GB BiRefNet model)

Sources (not served): assets/products-src/unknown/pants/<name>.webp, the generated photos on their
plain white background, one per pair plus model-base. Drop a regenerated photo in under the same
name and rerun; nothing else changes.

1. Cut-out -> cut/<name>.png. Alpha is rembg's BiRefNet subject mask. (scripts/cutout.mjs also
   flood-fills the backdrop from the border, but here that keeps the soft shoe shadows and the white
   gaps between arms and body as white blotches, so the mask is used alone.) Cached: a photo is only
   cut again when its source is newer than its cut-out.
2. Align -> every pair is scaled and moved onto model-base: scale from the torso width just under
   the top edge (same body in every photo), height from the shoe soles, x from the torso centre.
   (The waistband is no good as an anchor: each pair sits at its own height.)
3. Common crop -> the photos that are framed tighter than the base no longer reach the top edge
   once aligned, so all of them are cropped to the area every photo covers (keeping 3:4, centred on
   the body) and written back at the source size (1086 x 1448) to aligned/<name>.png.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

DIR = Path("assets/products-src/unknown/pants")
BASE = "model-base"
OUT_W, OUT_H = 1086, 1448


def cut_one(name):
    from rembg import new_session, remove

    img = Image.open(DIR / f"{name}.webp").convert("RGB")
    mask = remove(img, session=new_session("birefnet-general"), only_mask=True)
    img.putalpha(mask)
    img.save(DIR / "cut" / f"{name}.png")


def anchors(alpha):
    """Torso width + centre (rows 20-60, the run of opaque pixels through the image centre) and sole y."""
    a = alpha > 128
    h, w = a.shape
    widths, centres = [], []
    for y in range(20, 60, 4):
        l = r = w // 2
        while l > 0 and a[y, l - 1]:
            l -= 1
        while r < w - 1 and a[y, r + 1]:
            r += 1
        widths.append(r - l)
        centres.append((l + r) / 2)
    rows = np.nonzero(a.sum(axis=1) > 40)[0]
    return float(np.median(widths)), float(np.median(centres)), float(rows.max())


def main():
    if len(sys.argv) == 3 and sys.argv[1] == "--cut":
        return cut_one(sys.argv[2])  # one photo per process: BiRefNet needs a lot of memory

    (DIR / "cut").mkdir(exist_ok=True)
    (DIR / "aligned").mkdir(exist_ok=True)
    names = sorted(p.stem for p in DIR.glob("*.webp"))
    assert BASE in names, f"{BASE}.webp is required"

    for name in names:
        src, cut = DIR / f"{name}.webp", DIR / "cut" / f"{name}.png"
        if not cut.exists() or cut.stat().st_mtime < src.stat().st_mtime:
            print("cut out", name)
            subprocess.run([sys.executable, __file__, "--cut", name], check=True)

    imgs = {n: Image.open(DIR / "cut" / f"{n}.png").convert("RGBA") for n in names}
    bw, bcx, bsole = anchors(np.asarray(imgs[BASE].getchannel("A")))
    fits = {}  # name -> (scale, dx, dy): photo px -> base px
    for n, im in imgs.items():
        w, cx, sole = anchors(np.asarray(im.getchannel("A")))
        s = bw / w
        fits[n] = (s, bcx - cx * s, bsole - sole * s)
        flag = "  <- check this photo: framed very differently" if abs(s - 1) > 0.25 else ""
        print(f"{n:32} scale {s:.3f}  dx {fits[n][1]:+.0f}  dy {fits[n][2]:+.0f}{flag}")

    # common crop in base px: the body runs off the top edge, so start where every photo has pixels
    h, w = OUT_H, OUT_W
    top = max(0.0, *(dy for _, _, dy in fits.values()))
    ch = h - top
    cw = ch * w / h
    left = bcx - cw / 2
    k = ch / h  # base px per output px
    print(f"common crop: top {top:.0f}px, {cw:.0f} x {ch:.0f} -> {w} x {h}")

    for n, im in imgs.items():
        s, dx, dy = fits[n]
        # output px -> photo px; premultiplied alpha so the edges don't pick up the old backdrop
        out = im.convert("RGBa").transform(
            (w, h), Image.AFFINE, (k / s, 0, (left - dx) / s, 0, k / s, (top - dy) / s), resample=Image.BICUBIC
        ).convert("RGBA")
        out.save(DIR / "aligned" / f"{n}.png")


if __name__ == "__main__":
    main()
