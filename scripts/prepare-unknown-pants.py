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
4. Baked effects (so the browser never filters or masks while animating; measured to remove the
   dropped frames during swaps): the top fades to transparent on bare skin only (fade zone rule, below) (the torso fades out instead of
   ending in a hard line), and every pair except the base also gets a greyscale copy,
   aligned/<name>-grey.png, used for the peek and the ghost.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

DIR = Path("assets/products-src/unknown/pants")
BASE = "model-base"
OUT_W, OUT_H = 1086, 1448
# Fade zone rule (brief: the fade sits on bare skin only and never covers the pants): every photo
# gets a smoothstep fade that ENDS SAFE px above the top of its own waistband and starts no higher
# than its own top edge, at most FADE_LEN long. SAFE = 64 output px = 16 CSS px when the 3:4 frame is
# 362 CSS px tall (the smallest frame at 360 wide); more on every larger screen. Below the fade the
# body is fully opaque, so every pair shows the same 64px band of clear skin above its waistband.
# FADE_LEN = 84 px is the reference's fade (10-90% = 3.9% of the visible height); a photo with less
# skin above its waistband gets a shorter fade (see fade-zones.json and the pants HANDOFF).
SAFE = 64
FADE_LEN = 84


def _lab(rgb):
    rgb = rgb / 255.0
    rgb = np.where(rgb > 0.04045, ((rgb + 0.055) / 1.055) ** 2.4, rgb / 12.92)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = rgb @ m.T / np.array([0.9505, 1, 1.089])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def waistband(name):
    """Top of the waistband in the source photo (px): walking down the centre of the torso, the
    first of 6 rows where most of a 100px band is no longer the skin colour of the top rows."""
    a = np.asarray(Image.open(DIR / f"{name}.webp").convert("RGB")).astype(float)
    alpha = np.asarray(Image.open(DIR / "cut" / f"{name}.png").getchannel("A"))
    cx = int(np.median(np.nonzero(alpha[30] > 128)[0]))
    band = _lab(a[:, cx - 50:cx + 50])
    skin = np.median(band[10:40].reshape(-1, 3), 0)
    off = (np.sqrt(((band - skin) ** 2).sum(-1)) > 20).mean(1)
    return next(y for y in range(40, len(off) - 6) if all(off[y + i] > 0.6 for i in range(6)))


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
    for old in (DIR / "aligned").glob("*-grey.png"):
        old.unlink()
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

    # frame in base px: the base photo's own frame (top 0). Photos framed tighter than the base start
    # lower; each one's fade starts at its own top edge, so no photo shows a hard top line. (Cropping
    # to the area every photo covers cut the skin band off four of the five photos.)
    h, w = OUT_H, OUT_W
    top = 0.0
    ch = h - top
    cw = ch * w / h
    left = bcx - cw / 2
    k = ch / h  # base px per output px
    print(f"common crop: top {top:.0f}px, {cw:.0f} x {ch:.0f} -> {w} x {h}")

    zones = {}
    for n, im in imgs.items():
        s, dx, dy = fits[n]
        # waistband top and the photo's own top edge, in output px
        waist = (dy + s * waistband(n) - top) / k
        own_top = max(0.0, (dy - top) / k)
        end = waist - SAFE
        start = max(own_top, end - FADE_LEN)
        zones[n] = {"photo_top": round(own_top, 1), "fade_start": round(start, 1), "fade_end": round(end, 1),
                    "waistband": round(waist, 1), "clear_skin": SAFE, "fade_len": round(end - start, 1),
                    "short_by": round(max(0.0, FADE_LEN - (end - start)), 1)}
        # output px -> photo px; premultiplied alpha so the edges don't pick up the old backdrop
        out = im.convert("RGBa").transform(
            (w, h), Image.AFFINE, (k / s, 0, (left - dx) / s, 0, k / s, (top - dy) / s), resample=Image.BICUBIC
        ).convert("RGBA")
        a = np.asarray(out.getchannel("A")).astype(np.float32)
        t = np.clip((np.arange(h) - start) / max(1.0, end - start), 0, 1)
        ramp = (t * t * (3 - 2 * t))[:, None]
        out.putalpha(Image.fromarray((a * ramp).round().astype(np.uint8)))
        out.save(DIR / "aligned" / f"{n}.png")
        if n != BASE:
            grey = out.convert("LA").convert("RGBA")
            grey.save(DIR / "aligned" / f"{n}-grey.png")
    (DIR / "aligned" / "fade-zones.json").write_text(json.dumps(zones, indent=1))
    for n, z in zones.items():
        print(f"{n:32} waistband {z['waistband']:6.1f}  fade {z['fade_start']:6.1f}-{z['fade_end']:6.1f}"
              f" ({z['fade_len']:.0f}px, short by {z['short_by']:.0f})")


if __name__ == "__main__":
    main()
