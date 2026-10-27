"""Bring a new UNKNOWN cut-out's hanger in line with the rest of the rack (round 9, Tranquility jersey).

  hook <src.png> <out.png> <loopCenterX> <neckY> <scale>
      Scale every row above the walnut neck (the wire hook) uniformly about (loopCenterX, neckY), so the
      wire still meets the neck at the same point. Premultiplied-alpha Lanczos resampling.
  wood <src.png> <ref.png> <out.png>
      Match the hanger wood colour (per-channel mean/std over wood pixels in the top 700 rows) to a
      reference cut-out of the same view. Use a reference whose garment is not brown/yellow.

Values used for white-tranquility-mesh-tee (from scripts/measure-unknown-hooks.mjs output before the change):
  front 536 145 0.848 / back 539 145 0.856 / side 535 147 0.864, wood reference blue-striped-tee-<view>.png
"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation


def hook(src, out, ax, ny, s):
    ax, ny, s = int(ax), int(ny), float(s)
    im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float64)
    W = im.shape[1]
    top = im[:ny]
    a = top[..., 3:4] / 255
    pm = np.concatenate([top[..., :3] * a, top[..., 3:4]], -1)
    pim = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), "RGBA")
    nw, nh = round(W * s), round(ny * s)
    sc = np.asarray(pim.resize((nw, nh), Image.LANCZOS)).astype(np.float64)
    res = np.zeros_like(top)
    ox, oy = round(ax - ax * s), ny - nh
    res[oy:ny, max(ox, 0):max(ox, 0) + min(nw, W)] = sc[:, max(-ox, 0):max(-ox, 0) + min(nw, W)]
    al = res[..., 3:4] / 255
    rgb = np.where(al > 0, res[..., :3] / np.maximum(al, 1e-6), 0)
    full = im.copy()
    full[:ny] = np.concatenate([rgb, res[..., 3:4]], -1)
    Image.fromarray(np.clip(full.round(), 0, 255).astype(np.uint8), "RGBA").save(out)


def wood_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = (a[..., 3] > 200) & (r - b > 45) & (r > g) & (g > b)
    m[700:] = False
    return m


def wood(src, ref, out):
    A = np.asarray(Image.open(src).convert("RGBA")).astype(float)
    R = np.asarray(Image.open(ref).convert("RGBA")).astype(float)
    ma, mr = wood_mask(A), wood_mask(R)
    edge = binary_dilation(ma) & ~ma
    o = A.copy()
    for c in range(3):
        sa, sr = A[..., c][ma], R[..., c][mr]
        adj = (A[..., c] - sa.mean()) / sa.std() * sr.std() + sr.mean()
        o[..., c] = np.where(ma, adj, np.where(edge, (A[..., c] + adj) / 2, A[..., c]))
    Image.fromarray(np.clip(o.round(), 0, 255).astype(np.uint8), "RGBA").save(out)


if __name__ == "__main__":
    {"hook": hook, "wood": wood}[sys.argv[1]](*sys.argv[2:])
