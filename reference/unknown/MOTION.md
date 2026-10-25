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

## v2: choreography and atmosphere (measured before coding the October 24 rebuild)

Re-measured at 60 fps (Video B entry 0.40–0.90 s, tops swap 1.20–1.88 s; Video A pants swaps).

| What | Measured | v2 build |
|---|---|---|
| Section top edge | Not a hard line: across the top ~20–25% of the screen the rising section is partly see-through (hero visible through the incoming product), then solid | 30vh feather above the section (transparent → sky), plus a cloud band riding the edge |
| Sky tone | ≈ rgb(232,246,249) top, (238,252,253) lower, on camera (phone white balance adds blue) | Neutral cool white `#F3F5F7` → `#FAFBFC` (no saturated blue), static gradient |
| Hero during entry | Drifts up at ≈ 0.75× (parallax) | Hero held in place (sticky) underneath: it lingers, at zero per-frame cost (moving it cost 20–30% frames before) |
| Rest state | Model already wearing a product | Per brief: model in the neutral base pants, first pair waiting as a grey ghost at the right |
| Ghost → body | Slides ≈ 0.31 W over 0.33 s (≈ 30–80% of the swap), ease-out; stays faint, turns solid in the last ≈ 0.1 s | Travel 5–80% ease-out; grey → colour 50–85% |
| Outgoing pair | Fades in 0.17 s; no measurable drift | Per brief: fades 70–95% (after the new pair is mostly solid: short overlap, never see-through) while drifting 2% of the frame width to the LEFT, 40–100% |
| Next ghost | Slides in from beyond the right edge, 35–100%, ease-out | Same |
| Name roll | Up, line by line, 35–50 ms stagger | Same (6% per line) |
| Easing family | ease-out for travel, ease-in-out for opacity | Same, cubic |

## v3: crop edge (measured October 25)

Sharpest pants frame of `video-b-full-reel.mov` (3.5 s), model cropped to the screen: visible
height 360 px (crop line to soles), fade at the crop line 14 px from 10% to 90% opacity over the
skin (39 columns) = **3.9% of the visible height**; frames with motion blur read 5.6-5.9%. Below the
fade the body is fully opaque; nothing veils it. Ours was 8.0% (a 9% linear ramp) plus a mist band
in front of the waist. Now: smoothstep over 5.7% of the image height = 3.87% of the visible height,
mist moved behind the model.
