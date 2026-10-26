# /unknown QA, round 7 (production build)

Before = commit 5f68f27 (end of round 6; the footer "pre-round-6" panels are commit e41921d), after
= this branch. Both built and measured the same way on the same machine on 26 Oct 2026. Numbers are
in `components/unknown/HANDOFF.md` > Verification.

| File | What it shows |
|---|---|
| `1-rack-facing.jpg` | the rack at rest 1440 and the phone rack 390, before / after (every side view faces left) |
| `2-mobile-rack-walk.jpg` | the phone rack with each garment centred in turn (neighbours in side view) |
| `3-entry-1440.jpg`, `3-entry-390.jpg` | hero to pants: at rest, start, middle and end of the entry, before / after |
| `4-fade-overlays-1440.jpg`, `-390.jpg` | each pair with its fade zone (top band) and waistband line drawn on |
| `4-pants-cta-viewall-rest.jpg`, `4-pants-midswap.jpg`, `4-pants-5-widths.jpg` | the pinned stage: View all on the label row, no product link in the left block, the bar's single button |
| `6-lookbook.jpg` | Look-Book label + headline, no View all |
| `7-footer.jpg` | footer before round 6 vs now, with the sampled wall colour |
| `8-two-piece.jpg` | the Two Piece section at 5 widths |
| `9-hero-5-widths.jpg`, `9-sections-5-widths.jpg` | hero and every section below the pants at 1440 / 1024 / 768 / 390 / 360 |
| `mobile-rack-{360,390,430}-60fps.mp4` | the phone rack: drags, flings, rubber band, tap, focus view open / close |
| `scroll-desktop-1440-60fps.mp4`, `scroll-phone-390-60fps.mp4` | the whole page scrolled at 60 fps |
| `lighthouse-desktop.html`, `lighthouse-mobile.html` | Lighthouse 12 reports |
| `fade-margins.json` | per width and pair: fade end, waistband, margin, mist clearance (css px) |
