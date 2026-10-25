# /unknown QA, round 6 (production build)

Before = commit e41921d, after = this branch, both built and measured the same way on the same
machine on 25 Oct 2026.

| File | What it shows |
|---|---|
| `1-veil-inspo-vs-ours-1440.jpg`, `-390.jpg` | reference model vs ours, before / after, at rest and mid-swap |
| `1-pants-rest-midswap.jpg` | pants at rest and mid-swap, 1440 + 390, before / after |
| `2-release-join.jpg` | the last pair releasing into New Arrivals, before / after |
| `3-links-arrivals.jpg` | text links without arrows (section header) |
| `4-hero-1440-390.jpg`, `4-menu-390-360.jpg`, `4-mobile-rack.jpg` | hero, compact menu closed / open, phone rack |
| `5-sections-1440.jpg`, `5-sections-390.jpg` | every section below the pants, before / after |
| `6-lookbook.jpg`, `7-footer.jpg` | lookbook captions removed, footer columns on the right |
| `8-breakpoints-*.jpg` | hero, pants and every section at 1440 / 1024 / 768 / 390 / 360 |
| `*-60fps.mp4` | 60 fps screen recordings: page scroll (desktop, phone) and the phone rack (drags, flings, rubber band, focus view) |
| `lighthouse-*.html` | Lighthouse reports |
| `measure-gaps.js` | the capture + gap script: `node measure-gaps.js <outdir> 1440,390 http://localhost:3001/unknown` (with `NEWMAP=1` for this branch's scroll mapping). Gaps run from the last visible content of one section to the first of the next; links, buttons and inputs count by their box (M3 measures between containers), invisible elements are ignored. |
