"""UNKNOWN Slides section images (round 9). Reproducible; run from the repo root:
    python3 scripts/build-unknown-slides.py
Input: assets/products-src/unknown/slides/unknown-f1-slide-floor.jpg (the supplied photo, as received:
1500 x 2000) and its BiRefNet mask (masks/, made with rembg `birefnet-general`).
Steps: cut out -> straighten (pair's mean axis to vertical) -> crop the heels' cut flat (they run off
the photo's bottom edge) -> centre on a 4:5 transparent canvas, heels on the bottom edge -> bake one soft
contact shadow -> 2x (1280 x 1600) and 1x (640 x 800). Strap: a 4:5 crop of the left strap's white
"unknown" script at the source's own resolution (no upscaling).
Output: public/products/unknown/slides/*.png (encoded to WebP by scripts/encode-unknown-slides.mjs).
"""
import os
import numpy as np
from PIL import Image, ImageFilter

SRC = "assets/products-src/unknown/slides/unknown-f1-slide-floor.jpg"
MASK = "assets/products-src/unknown/slides/masks/unknown-f1-slide-floor.png"
OUT = "public/products/unknown/slides"
os.makedirs(OUT, exist_ok=True)

rgb = Image.open(SRC).convert("RGB")
mask = Image.open(MASK).convert("L")
W, H = rgb.size


def axis_angle(m):
    """Mean long-axis angle (deg, + = top leans right) of the two slides, split at the gap."""
    a = np.asarray(m) > 127
    ys, xs = np.nonzero(a)
    cols = a.sum(0)
    lo, hi = xs.min() + 200, xs.max() - 200
    mid = lo + int(np.argmin(cols[lo:hi]))
    angs = []
    for sel in (xs < mid, xs >= mid):
        x, y = xs[sel] - xs[sel].mean(), ys[sel] - ys[sel].mean()
        w, v = np.linalg.eigh(np.cov(np.vstack([x, y])))
        vx, vy = v[:, 1]
        if vy < 0:
            vx, vy = -vx, -vy
        angs.append(np.degrees(np.arctan2(-vx, vy)))  # vector points down: top leans right if vx < 0
    return float(np.mean(angs)), angs


ang, per = axis_angle(mask)
rgba = rgb.copy()
rgba.putalpha(mask)
valid = Image.new("L", (W, H), 255)
# PIL rotates counter-clockwise for positive angles: that brings a top leaning right (+) upright
rot = rgba.rotate(ang, resample=Image.BICUBIC, expand=True)
vrot = valid.rotate(ang, resample=Image.NEAREST, expand=True)
after, per_after = axis_angle(rot.getchannel("A"))
print(f"axis before {ang:+.2f} deg (slides {per[0]:+.2f}, {per[1]:+.2f}); after {after:+.2f} ({per_after[0]:+.2f}, {per_after[1]:+.2f})")

A = np.asarray(rot.getchannel("A")) > 8
V = np.asarray(vrot) > 0
ys, xs = np.nonzero(A)
x0, x1, y0 = xs.min(), xs.max(), ys.min()
# flat heel line: the lowest row that is still inside the source photo across the pair's width
rows = [y for y in range(y0, rot.height) if V[y, x0:x1 + 1].all()]
y1 = max(rows)
pair = rot.crop((x0, y0, x1 + 1, y1 + 1))
print("pair", pair.size, "flat heel row", y1)

# 2x canvas 1280 x 1600: pair 84% of the canvas height, centred horizontally, heels on the bottom edge
CW, CH = 1280, 1600
s = min(CH * 0.84 / pair.height, CW * 0.86 / pair.width)
pw, ph = round(pair.width * s), round(pair.height * s)
pair2 = pair.resize((pw, ph), Image.LANCZOS)
canvas = Image.new("RGBA", (CW, CH), (0, 0, 0, 0))
px, py = (CW - pw) // 2, CH - ph
# soft contact shadow: the pair's silhouette, blurred, 12px lower, 22% black
sh = Image.new("L", (CW, CH), 0)
sh.paste(pair2.getchannel("A"), (px, py + 12))
sh = sh.filter(ImageFilter.GaussianBlur(22)).point(lambda v: int(v * 0.22))
canvas = Image.composite(Image.new("RGBA", (CW, CH), (20, 20, 18, 255)), canvas, sh)
canvas.alpha_composite(pair2, (px, py))
canvas.save(f"{OUT}/unknown-f1-slide-pair@2x.png")
canvas.resize((CW // 2, CH // 2), Image.LANCZOS).save(f"{OUT}/unknown-f1-slide-pair.png")
print("scale 2x", round(s, 3), "(source px per output px", round(1 / s, 2), ")")

# strap: 4:5 crop around the left strap's white "unknown" script, native resolution. The script's centre
# in the straightened photo was measured by eye (automatic white detection locks onto bright floor
# showing between the slides); it spans about 300 x 100 source px.
cx, cy = 527, 773
cw = 560
chh = cw * 5 // 4
box = (cx - cw // 2, cy - chh // 2, cx + cw // 2, cy + chh // 2)
strap = rot.crop(box)
print("strap centre", (cx, cy), "crop", box)
ground = Image.new("RGBA", strap.size, (0, 0, 0, 0))
ground.alpha_composite(strap)
ground.save(f"{OUT}/unknown-f1-slide-strap.png")
