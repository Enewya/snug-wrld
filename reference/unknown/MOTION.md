# UNKNOWN pants section: measured reference motion

Sources: `video-a-pants-swap.mov` (5.5 s) and `video-b-full-reel.mov` (4.2 s), both phone recordings
of a laptop screen ("NORTH" Shopify template). Extracted at 60 fps and cropped to the laptop
screen; values were measured by tracking pixels (edge position, colour of fixed patches, ink per
text line), not by eye. The page in the videos renders at 30 fps (frames arrive in pairs), so
times are ±17 ms. Distances are given as a share of the screen width (W) or height (H).

| What | Measured | How we use it |
|---|---|---|
| **Entry from the hero** | The white section scrolls up **over** the hero. Its top edge crosses the whole screen in **0.48 s** with an ease-in-out speed profile (11 → 45 → 5 px per frame): smoothed scrolling, not a timed animation | Section scrolls up over the hero (higher z-index); scroll progress is lerp-smoothed |
| Hero during entry | Moves up too, but slower: **≈ 0.75×** the section's speed (gentle parallax). No fade or scale visible | Hero content drifts at 0.75× while the section covers it, plus a soft shadow on the section's top edge |
| Pinning | The product is already in place inside the rising section; it pins the moment the section's top reaches the top of the screen | `position: sticky` stage, pinned immediately |
| **Swap, total** | **≈ 0.68 s** from first change to settled (tops swap 1.20 → 1.88 s; pants swaps in A ≈ 0.5–0.6 s) | Scroll-scrubbed, mapped to the middle 50% of each step's scroll; with smoothing it plays in ~0.6–0.8 s at a normal scroll speed |
| Outgoing pair | Fades out in **0.17 s** (0–25% of the swap), ease-in (slow start). Drift: none measurable (< 1% H) | Fade over 0–30% of the swap, ease-in, plus a 12 px drop (your brief) |
| Base model | Fully visible **0.25 s** in the middle of the swap (≈ 30–65%); never visible at rest | Opacity bump 0 → 1 → 0 over 0–100%, plateau 25–70% |
| Ghost (incoming) | Starts at the peek position (**≈ 0.83 W**, same scale as the model, light grey ≈ 25–30% opacity), slides **≈ 0.31 W** left onto the model over **0.33 s** (≈ 30–80%), stays faint while travelling and turns solid as it lands (≈ 0.1 s) | Grey copy + colour copy move together: travel 25–85% ease-out; grey fades out and colour fades in over 60–100% |
| Next peek | Slides in from **beyond the right edge** to the peek position over **0.43 s** (≈ 35–100%), fading in | Same, ease-out |
| Name, out | Lines roll **up** and out, line by line, **≈ 1–2 frames (35–50 ms) stagger**, 0.22 s (15–50%) | Per-line translateY(0 → −100%) inside a mask, stagger 0.06 of the swap per line |
| Name, in | New lines roll up from below, 0.15 s (55–80%), same stagger | translateY(100% → 0), 50–85% |
| Price / link / buy bar | Cross-fade with the name | Opacity, 20–80% |
| Peek at rest | Fully on screen at ≈ 0.83 W, same scale as the model, grey ≈ 25–30% | `--peek-x: 33vw` from centre, opacity 0.28, greyscale copy |

Name type: see `name-type-crop.png` and the font notes in `components/unknown/pants-section/HANDOFF.md`.
