# /unknown QA, round 8 (production build unless marked dev)

Before = commit b4146f6 (end of round 7), after = this branch; both built and measured the same way
on the same machine on 26 Oct 2026. Numbers: `components/unknown/HANDOFF.md` > Verification and
Responsive; pants specifics in `components/unknown/pants-section/HANDOFF.md`.

| File | Item | What it shows |
|---|---|---|
| `1-visit-footer-gap.jpg` | 1 | Visit section into the footer, before / after, at 1440, 1024, 768, 390, 360 |
| `2-rack-facing-contact-sheet.jpg` | 2 | every rack garment: side as photographed, side as shown, front; the facing decision and its cue |
| `2-rack-before-after.jpg` | 2 | full rack at 1440 and the phone rack at 390, before / after |
| `3-pants-before-after.jpg`, `3-pants-arrangement-5-widths.jpg` | 3 | the new details (eyebrow, name, price, View product), no bottom bar, View all bottom right |
| `5-matrix-<section>.jpg` | 5 | every section at 15 widths + two landscape phones |
| `6ab-rack-load-and-limits.jpg` | 6a, 6b | phone rack on first load (side views only) and held at the left and right drag limits, 360 / 390 / 430 |
| `6c-header-requested-vs-shipped.jpg` | 6c | the requested centred wordmark (forced) vs what ships, 320 / 360 / 390 / 430 / 480 |
| `7-pants-cutout-contact-sheet.jpg` | 7 | each pants cut-out on a checkerboard, composite, original; body, hands, 50% overlay |
| `7-body-fixed-overlay.jpg` | 7 | the five states averaged in the browser: body, arms and shoes stay sharp (no ghosting) |
| `7-midswap-before-after.jpg` | 7 | mid-swap at 1440 and 390, before (whole photos) / after (only the pants move) |
| `7-fade-overlays.jpg` | 7 | the one shared fade on the body and each pair's waistband, 1440 and 390 |
| `pants-swaps-{1440,390}-60fps.mp4` | 7 | every swap at 60 fps |
| `lookbook-{1440,390}-60fps.mp4` | 4 | up from the footer through the lookbook and back down |
| `scroll-desktop-1440-60fps.mp4`, `scroll-phone-390-60fps.mp4` | gates | the whole page |
| `mobile-rack-{360,390,430}-60fps.mp4` | 6 | drags, flings, rubber band, focus view |
| `lighthouse-desktop.html`, `lighthouse-mobile.html` | gates | Lighthouse 12 |
