"""Generates the pants-section atmosphere: soft white cloud layers as transparent WebP.

    python3 scripts/generate-unknown-clouds.py      (needs: pip install pillow numpy scipy)

Procedural fractal noise -> soft threshold -> gaussian blur -> white with alpha. Pre-rendered so
the browser never runs a blur filter; the section only moves them with transform. Output:
public/products/unknown/atmosphere/{clouds-back,clouds-front,mist}.webp (each under 120 KB).
"""
import numpy as np
from PIL import Image
from scipy import ndimage

OUT = "public/products/unknown/atmosphere"
rng = np.random.default_rng(7)


def fbm(h, w, octaves=6, base=6):
    """Fractal noise in 0..1 (sum of upsampled random grids)."""
    out = np.zeros((h, w))
    amp, total = 1.0, 0.0
    for o in range(octaves):
        cells = base * 2 ** o
        g = rng.random((max(2, int(cells * h / w)), cells))
        up = ndimage.zoom(g, (h / g.shape[0], w / g.shape[1]), order=3)[:h, :w]
        out += up * amp
        total += amp
        amp *= 0.5
    out /= total
    return (out - out.min()) / (out.max() - out.min())


def layer(name, w, h, cover, softness, blur, envelope, max_alpha, quality=72):
    n = fbm(h, w)
    a = np.clip((n - (1 - cover)) / softness, 0, 1)  # soft threshold: puffs
    a = ndimage.gaussian_filter(a, blur)
    a *= envelope(np.linspace(0, 1, h))[:, None]
    # wrap horizontally: fade the side edges so a slight drift never shows a seam
    x = np.linspace(0, 1, w)
    a *= np.clip(np.minimum(x, 1 - x) / 0.12, 0, 1)[None, :]
    alpha = (np.clip(a, 0, 1) * max_alpha * 255).astype(np.uint8)
    rgba = np.dstack([np.full((h, w, 3), 255, np.uint8), alpha])
    img = Image.fromarray(rgba, "RGBA")
    path = f"{OUT}/{name}.webp"
    img.save(path, "WEBP", quality=quality, alpha_quality=70, method=6)
    import os
    print(f"{path}: {w}x{h}, {os.path.getsize(path) / 1024:.0f} KB")


bump = lambda c, s: (lambda t: np.exp(-((t - c) / s) ** 2))  # noqa: E731
# back: a broad bank in the upper-middle of the stage
layer("clouds-back", 1600, 700, cover=0.55, softness=0.35, blur=14, envelope=bump(0.45, 0.32), max_alpha=0.9)
# front: lighter puffs lower down, moved a little faster for depth
layer("clouds-front", 1600, 500, cover=0.45, softness=0.3, blur=10, envelope=bump(0.55, 0.3), max_alpha=0.85)
# mist: a soft horizontal band that sits over the model's waist where the crop fades out, and on
# the section's top edge so the entry has no hard line
layer("mist", 1600, 360, cover=0.7, softness=0.45, blur=18, envelope=bump(0.5, 0.26), max_alpha=1.0)
