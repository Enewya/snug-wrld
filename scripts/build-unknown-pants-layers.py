"""Builds the UNKNOWN pants-section layers: one fixed body, pants-only cut-outs, hands on top.

    python3 scripts/build-unknown-pants-layers.py     (then: node scripts/optimize-unknown-pants.mjs)
    needs: pip install "rembg[cpu]" pillow numpy scipy  (rembg only for the subject masks; the first
    run downloads the ~1 GB BiRefNet model)

Sources (not served): assets/products-src/unknown/pants/<name>.webp, generated photos of one model in
one pose on white, one per pair plus model-base (grey chinos). Every pair photo matches the base
except for the pants, so the layers come from the photos themselves:

1. Subject mask per photo (BiRefNet, cached in masks/<name>.png): soft alpha against the backdrop.
2. Register each pair onto the base (scale + shift, from the torso width under the top edge and
   the shoe soles; refined on the torso and shoe pixels). Photos already within 0.5px are kept.
3. Body = every base subject pixel that is identical in at least 2 of the 4 pair photos (torso,
   arms, hands and shoes match in nearly every photo, give or take a few px of finger; the base
   chinos match none). In the shoe zone the shoe tops are hidden by the wider pants in 3 of 4
   photos, so there a pixel is body if one pair matches it closely (SAME_SHOE) or it is bright
   neutral (white shoe). Pants of photo k = its subject minus the body, never within HAND_PAD px of
   the base hands (the hands layer covers that ring; the pants are filled in under it).
   No skin-colour test anywhere, so the brown pants (close to skin) are separated by difference,
   not by colour. Spots a photo reveals that the base chinos covered (skin above a lower
   waistband, shoe above a higher cuff) are taken into the body from that photo by colour.
4. Hands (and forearms) = the base's arm pixels below the chest, alpha-matted against the chinos
   (each edge pixel split into skin + chinos), so they show no grey fringe over other pants.
5. Each pants cut-out is filled in under the hands (the closed silhouette, colours diffused in from
   the surrounding fabric), so a moving pair never shows a hand-shaped hole.
6. One shared top fade on the body (smoothstep), ending SAFE px above the highest waistband of all
   pants, so it sits on bare skin only.

Outputs (aligned/, all 1086 x 1448 RGBA on one canvas): body.png, hands.png, <name>.png (pants only,
the base chinos included as model-base.png), <name>-grey.png (pants only, for the ghost),
layers.json (waistbands, fade zone, registration, error checks), contact-sheet.jpg.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

DIR = Path("assets/products-src/unknown/pants")
OUT = DIR / "aligned"
BASE = "model-base"
PAIRS = ["unknown-denim-jean", "unknown-side-eye-baggy-pant", "unknown-logo-sweatpant-brown", "unknown-lgt-strikes-joggers"]
W, H = 1086, 1448
SAME = 18  # max channel difference that still counts as "the same pixel" (JPEG/WebP noise is ~6)
SAME_SHOE = 10  # tighter in the shoe zone: the grey wide pants are only ~18 off the grey chinos
SHOE_Y = 1150  # shoe zone starts here (source px)
HAND_PAD = 6  # pants keep this far from the base hands (generated fingers differ by a few px)
SAFE = 64  # fade ends this many source px above the highest waistband (16 CSS px at 360 wide)
FADE_LEN = 84  # the reference's fade length (source px), when there is room for it
TORSO = (360, 725)  # x range of the torso; arms hang outside it (measured on the base)


def load(name):
    return np.asarray(Image.open(DIR / f"{name}.webp").convert("RGB")).astype(np.float32)


def subject_mask(name):
    p = DIR / "masks" / f"{name}.png"
    src = DIR / f"{name}.webp"
    if not p.exists() or p.stat().st_mtime < src.stat().st_mtime:
        p.parent.mkdir(exist_ok=True)
        from rembg import new_session, remove
        m = remove(Image.open(src).convert("RGB"), session=new_session("birefnet-general"), only_mask=True)
        m.save(p)
    return np.asarray(Image.open(p).convert("L")).astype(np.float32) / 255


def lab(rgb):
    c = rgb / 255
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    x = (c @ np.array([0.4124, 0.3576, 0.1805])) / 0.95047
    y = c @ np.array([0.2126, 0.7152, 0.0722])
    z = (c @ np.array([0.0193, 0.1192, 0.9505])) / 1.08883
    f = lambda t: np.where(t > 0.008856, np.cbrt(t), 7.787 * t + 16 / 116)  # noqa: E731
    fx, fy, fz = f(x), f(y), f(z)
    return np.stack([116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)], -1)


def warp(img, s, dx, dy, order=1):
    """Scale by s about the image's top centre, then shift (dx, dy). Works on HxW or HxWxC."""
    cx = W / 2
    # output (y, x) samples input ((y - dy) / s, (x - dx - cx) / s + cx)
    def one(ch):
        return ndimage.affine_transform(ch, [1 / s, 1 / s], offset=[-dy / s, -(dx + cx) / s + cx], order=order, mode="nearest")
    if img.ndim == 2:
        return one(img)
    return np.stack([one(img[..., k]) for k in range(img.shape[2])], -1)


def register(base, alpha_b, img, alpha):
    """Scale + shift that puts img's body on the base's body."""
    def span(a, y):
        xs = np.where(a[y] > 0.5)[0]
        return xs.min(), xs.max()
    def bottom(a):
        return np.where((a > 0.5).any(1))[0].max()
    (l0, r0), (l1, r1) = span(alpha_b, 40), span(alpha, 40)
    s0 = (r0 - l0) / (r1 - l1)
    best = None
    rows = np.r_[0:90, 1240:1330]
    g_b = base.mean(2)
    for s in np.arange(s0 - 0.004, s0 + 0.0045, 0.001):
        # height from the shoe soles, x from the torso centre
        dy0 = bottom(alpha_b) - bottom(alpha) * s
        dx0 = (l0 + r0) / 2 - (((l1 + r1) / 2 - W / 2) * s + W / 2)
        for dy in np.arange(dy0 - 2, dy0 + 2.5, 0.5):
            for dx in np.arange(dx0 - 2, dx0 + 2.5, 0.5):
                w = warp(img.mean(2), s, dx, dy)
                err = np.abs(w[rows] - g_b[rows]).mean()
                if best is None or err < best[0]:
                    best = (err, s, dx, dy)
    return best


def main():
    OUT.mkdir(exist_ok=True)
    names = [BASE] + PAIRS
    rgb = {n: load(n) for n in names}
    alpha = {n: subject_mask(n) for n in names}
    report = {"registration": {}, "waistband": {}, "checks": {}}

    # 2. registration (only where a photo is off the base by more than half a pixel)
    for n in PAIRS:
        a = alpha[n]
        xs_b = np.where(alpha[BASE][40] > 0.5)[0]
        xs = np.where(a[40] > 0.5)[0]
        bot_b = np.where((alpha[BASE] > 0.5).any(1))[0].max()
        bot = np.where((a > 0.5).any(1))[0].max()
        if abs((xs.max() - xs.min()) - (xs_b.max() - xs_b.min())) <= 1 and abs(bot - bot_b) <= 1 and abs(xs.min() - xs_b.min()) <= 1:
            report["registration"][n] = {"scale": 1, "dx": 0, "dy": 0, "note": "already on the base"}
            continue
        err, s, dx, dy = register(rgb[BASE], alpha[BASE], rgb[n], a)
        rgb[n] = warp(rgb[n], s, dx, dy)
        alpha[n] = warp(a, s, dx, dy)
        report["registration"][n] = {"scale": round(float(s), 4), "dx": round(float(dx), 2), "dy": round(float(dy), 2), "err": round(float(err), 2)}
        print(f"registered {n}: scale {s:.4f}, shift {dx:.1f}, {dy:.1f} (mean |diff| on torso + shoes {err:.2f})")

    # 3. body = identical in every photo (and part of the subject)
    base = rgb[BASE]
    diff = {n: np.abs(rgb[n] - base).max(2) for n in PAIRS}
    # a little smoothing so single noisy pixels do not flip
    dmed = {n: ndimage.median_filter(diff[n], 3) for n in PAIRS}
    same_count = sum((dmed[n] < SAME).astype(np.int8) for n in PAIRS)
    shoe_same = sum((dmed[n] < SAME_SHOE).astype(np.int8) for n in PAIRS)
    lb_base = lab(base)
    shoe_white = (lb_base[..., 0] > 84) & (np.hypot(lb_base[..., 1], lb_base[..., 2]) < 4)
    yy0 = np.arange(H)[:, None]
    subj_b = alpha[BASE] > 0.5
    body = subj_b & np.where(yy0 < SHOE_Y, same_count >= 2, (shoe_same >= 1) | shoe_white)
    body = ndimage.binary_closing(body, iterations=2) & subj_b
    # keep the body's large parts only (torso + arms, two shoes): drops specks inside the pants
    lab_, k = ndimage.label(body)
    sizes = ndimage.sum(body, lab_, range(1, k + 1))
    body = np.isin(lab_, 1 + np.where(sizes > 2000)[0])
    body = ndimage.binary_fill_holes(body)
    chinos = subj_b & ~body
    chinos = ndimage.binary_opening(chinos, iterations=1)

    # arms + hands of the base (outside the torso band, below the chest) and a ring around them
    yy, xx = np.mgrid[0:H, 0:W]
    arms = body & ((xx < TORSO[0]) | (xx > TORSO[1])) & (yy > 60) & (yy < 1100)
    arms_pad = ndimage.binary_dilation(arms, iterations=HAND_PAD)

    # pants of each pair: its subject minus the body (where it still shows the body), clear of
    # the hands' ring
    pants = {BASE: ndimage.binary_opening(chinos & ~arms_pad, iterations=2)}
    for n in PAIRS:
        subj = alpha[n] > 0.5
        same = dmed[n] < SAME
        p = subj & ~(body & same) & ~arms_pad
        # white shoe under a hem is shoe, not pants (cream pants have more colour than this)
        lb = lab(rgb[n])
        p &= ~((yy > SHOE_Y) & (lb[..., 0] > 86) & (np.hypot(lb[..., 1], lb[..., 2]) < 3))
        p = ndimage.binary_opening(p, iterations=2)
        lab_, k = ndimage.label(p)
        sizes = ndimage.sum(p, lab_, range(1, k + 1))
        p = np.isin(lab_, 1 + np.where(sizes > 5000)[0])
        pants[n] = ndimage.binary_fill_holes(p)

    # the hands' ring cut notches into the pants' outer edges: rebuild each outer edge across the
    # rows the ring touches by interpolating it from the rows above and below (the fill below then
    # gives those pixels fabric colour), so a moving pair never shows a notch
    def mend_edges(p):
        p = p.copy()
        rows = np.arange(H)
        left = np.array([np.argmax(r) if r.any() else -1 for r in p])
        right = np.array([W - 1 - np.argmax(r[::-1]) if r.any() else -1 for r in p])
        for edge, side in ((left, -1), (right, 1)):
            near = np.array([e >= 0 and arms_pad[y, max(0, e - 4):e + 5].any() for y, e in zip(rows, edge)])
            near = ndimage.binary_dilation(near, iterations=6)
            ok = (edge >= 0) & ~near
            if ok.sum() < 2:
                continue
            fixed = np.interp(rows, rows[ok], edge[ok])
            for y in rows[near & (edge >= 0)]:
                e, f = edge[y], int(round(fixed[y]))
                if side < 0 and f < e:
                    p[y, f:e] = True
                elif side > 0 and f > e:
                    p[y, e + 1:f + 1] = True
        return p
    for n in names:
        pants[n] = mend_edges(pants[n])

    # spots a pair reveals that the chinos covered: in the pair they are not pants-coloured but
    # skin (waist) or white shoe (above a cuff). Colour test only inside those small zones.
    L = {n: lab(rgb[n]) for n in names}
    revealed = {}
    for n in PAIRS:
        zone = chinos & (alpha[n] > 0.5)
        lb = L[n]
        skin = (lb[..., 1] > 8) & (lb[..., 2] > 8) & (lb[..., 0] < 72)
        shoe = (lb[..., 0] > 80) & (np.hypot(lb[..., 1], lb[..., 2]) < 3.5)
        yy = np.arange(H)[:, None]
        r = zone & ((skin & (yy < 400)) | (shoe & (yy > 1150)))
        # pants colours never count: the pair's own pants colour (median inside its pants) must be far
        med = np.median(lb[pants[n] & ~zone], axis=0) if (pants[n] & ~zone).any() else np.median(lb[pants[n]], axis=0)
        r &= np.linalg.norm(lb - med, axis=-1) > 12
        r = ndimage.binary_opening(r, iterations=1)
        lab_, k = ndimage.label(r)
        if k:
            sizes = ndimage.sum(r, lab_, range(1, k + 1))
            r = np.isin(lab_, 1 + np.where(sizes > 40)[0])
        revealed[n] = r
        pants[n] &= ~r
        report["checks"].setdefault(n, {})["revealed_px"] = int(r.sum())

    # waistband of each pants: its top edge, median over the centre columns
    def waist(p):
        tops = []
        for x in range(TORSO[0] + 40, TORSO[1] - 40):
            ys = np.where(p[:, x])[0]
            if len(ys):
                tops.append(ys.min())
        return int(np.median(tops))
    for n in names:
        report["waistband"][n] = waist(pants[n])
    top_waist = min(report["waistband"].values())
    fade_end = top_waist - SAFE
    fade_start = max(0, fade_end - FADE_LEN)
    report["fade"] = {"start": fade_start, "end": fade_end, "highest_waistband": top_waist, "safe": SAFE}
    print("waistbands", report["waistband"], "fade", fade_start, "-", fade_end)

    # 4. hands: base arm pixels outside the torso band, below the chest, matted against the chinos
    chino_col = np.median(base[chinos], axis=0)
    band = ndimage.binary_dilation(arms, iterations=2) & ~ndimage.binary_erosion(arms, iterations=2)
    inner = ndimage.binary_erosion(arms, iterations=3)
    # local skin colour: nearest inner arm pixel
    idx = ndimage.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    skin_col = base[idx[0], idx[1]]
    v = skin_col - chino_col
    a_mat = np.clip(((base - chino_col) * v).sum(-1) / np.maximum((v * v).sum(-1), 1), 0, 1)
    hand_a = np.where(arms & ~band, 1.0, 0.0)
    near_chinos = ndimage.binary_dilation(chinos, iterations=3)
    hand_a = np.where(band & near_chinos, a_mat, hand_a)
    hand_a = np.where(band & ~near_chinos, alpha[BASE] * arms, hand_a)  # against the backdrop: BiRefNet
    hand_rgb = np.where((band & near_chinos)[..., None], skin_col, base)
    hands = np.dstack([hand_rgb, hand_a[..., None] * 255]).clip(0, 255).astype(np.uint8)

    # body layer: base body + revealed spots; soft edge against the backdrop, shared top fade
    body_rgb = base.copy()
    body_a = np.where(body, alpha[BASE], 0.0)
    for n in PAIRS:
        body_rgb[revealed[n]] = rgb[n][revealed[n]]
        body_a = np.where(revealed[n], np.maximum(body_a, alpha[n]), body_a)
    t = np.clip((np.arange(H) - fade_start) / max(1, fade_end - fade_start), 0, 1)
    body_a *= (t * t * (3 - 2 * t))[:, None]
    body_l = np.dstack([body_rgb, body_a[..., None] * 255]).clip(0, 255).astype(np.uint8)

    # 5. pants layers: filled in under the hands, soft edge against the backdrop only
    layers = {}
    for n in names:
        p = pants[n]
        closed = ndimage.binary_closing(p, structure=np.ones((3, 3)), iterations=14) | p
        orig = ndimage.binary_fill_holes(p & (alpha[n] > 0.5)) & ~arms_pad  # pixels that really show this pants
        # a generated thumb or its shadow can sit a few px off the base's: skin-coloured pixels close
        # to the hands (compared with that hand's own skin, so brown fabric is judged against real
        # skin, not a skin range) are not fabric either
        near = ndimage.binary_dilation(arms, iterations=16) & orig
        if near.any():
            sk = lab(skin_col)
            de = np.linalg.norm(L[n] - sk, axis=-1)
            fabric = np.median(L[n][orig & ~near], axis=0)
            closer_to_skin = de < np.linalg.norm(L[n] - fabric, axis=-1)
            orig &= ~(near & closer_to_skin & (de < 16))
        # hems: thin slivers of shoe (shading, laces) along the bottom edge are not fabric
        hem = np.arange(H)[:, None] > SHOE_Y
        orig = np.where(hem, ndimage.binary_opening(orig, iterations=4), orig)
        fill = closed & ~orig & ndimage.binary_dilation(arms_pad, iterations=8)
        p = orig
        full = p | fill
        col = rgb[n].copy()
        # fabric under the hands: mirror the neighbouring fabric across the cut line (each filled
        # pixel takes the colour of the pixel as far inside the pants as it is outside), so the
        # texture continues instead of smearing
        if fill.any():
            iy, ix = ndimage.distance_transform_edt(~p, return_distances=False, return_indices=True)
            fy, fx = np.where(fill)
            ny, nx = iy[fy, fx], ix[fy, fx]
            my = np.clip(2 * ny - fy, 0, H - 1)
            mx = np.clip(2 * nx - fx, 0, W - 1)
            good = p[my, mx]
            col[fy, fx] = np.where(good[:, None], rgb[n][my, mx], rgb[n][ny, nx])
        a = np.where(p, alpha[n], 0.0)
        a = np.where(fill, 1.0, a)
        # where the pants meet the body (waist, hands, shoes) the edge is the cut line itself:
        # a 1px feather so it is not stair-stepped
        edge = full & ~ndimage.binary_erosion(full) & ndimage.binary_dilation(body | revealed.get(n, np.zeros_like(body)))
        a = np.where(edge, a * 0.6, a)
        layers[n] = np.dstack([col, a[..., None] * 255]).clip(0, 255).astype(np.uint8)
        report["checks"].setdefault(n, {})["filled_under_hands_px"] = int(fill.sum())

    # checks: body + pants + hands must rebuild each photo; report the error outside the filled area
    def over(dst, src):
        a = src[..., 3:4] / 255
        rgb_ = src[..., :3] * a + dst[..., :3] * (1 - a)
        return rgb_
    white = np.full((H, W, 3), 255.0)
    comps = {}
    for n in names:
        c = over(white, body_l)
        c = over(np.dstack([c, np.full((H, W), 255)]), layers[n])
        c = over(np.dstack([c, np.full((H, W), 255)]), hands)
        comps[n] = c
        region = (alpha[n] > 0.5) & (np.arange(H)[:, None] > fade_end + 4)
        err = np.abs(c - rgb[n]).max(2)[region]
        report["checks"].setdefault(n, {}).update({
            "rebuild_mean_abs": round(float(err.mean()), 2),
            "rebuild_px_over_40": round(float((err > 40).mean() * 100), 3),
        })
        print(n, report["checks"][n])

    # save
    Image.fromarray(body_l, "RGBA").save(OUT / "body.png")
    Image.fromarray(hands, "RGBA").save(OUT / "hands.png")
    for n in names:
        Image.fromarray(layers[n], "RGBA").save(OUT / f"{n}.png")
        g = layers[n].astype(np.float32)
        lum = g[..., :3] @ np.array([0.299, 0.587, 0.114])
        grey = np.dstack([lum, lum, lum, g[..., 3]]).clip(0, 255).astype(np.uint8)
        if n != BASE:
            Image.fromarray(grey, "RGBA").save(OUT / f"{n}-grey.png")
    (OUT / "layers.json").write_text(json.dumps(report, indent=1))

    # contact sheet: per photo its pants on a checkerboard, then body, hands, composite, overlay
    cs = 300
    def thumb(a):
        im = Image.fromarray(a.astype(np.uint8), "RGBA" if a.shape[2] == 4 else "RGB")
        return im.resize((cs, int(cs * H / W)), Image.LANCZOS)
    chk = ((np.indices((H, W)).sum(0) // 24) % 2)[..., None] * 40 + 200
    chk = np.repeat(chk, 3, 2).astype(np.float32)
    def on_chk(layer):
        return over(chk, layer)
    cols = []
    for n in names:
        cols.append([thumb(on_chk(layers[n])), thumb(comps[n]), thumb(rgb[n])])
    extra = [thumb(on_chk(body_l)), thumb(on_chk(hands)),
             thumb(np.mean([comps[n] for n in names], 0))]
    th = cols[0][0].height
    sheet = Image.new("RGB", ((len(names) + 1) * (cs + 10), 3 * (th + 10)), (120, 120, 120))
    for i, c in enumerate(cols + [extra]):
        for j, t_ in enumerate(c):
            sheet.paste(t_.convert("RGB"), (i * (cs + 10), j * (th + 10)))
    sheet.save(OUT / "contact-sheet.jpg", quality=88)
    print("wrote", OUT)


if __name__ == "__main__":
    sys.exit(main())
