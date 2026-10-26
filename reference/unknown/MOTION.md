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

## v4: mobile rack (measured October 26, before coding)

Source: `video-c-mobile-rack.mp4` (the client's reel: a direct phone screen recording, 1180 x 2556,
60 fps, 601 frames; the page in it renders at 30 fps, so motion is measured in 33.3 ms steps; the
reel loops at frame ~480). 1180 px = 100vw. Hanger positions were tracked automatically on the row
y = 1010 (between rail and price tags) in every frame; sway from the garment's horizontal centroid
in an upper (y 1150-1300) and a lower (y 1550-1700) band relative to its hook.

| What | Measured |
|---|---|
| Rail | static; 15 px thick (1.3vw) at y 976-990; spans x 18-1146 with an end bracket at each end (1.5vw in from the left edge; 2.9vw on the right, partly under the reel's overlay), not past the edges; centre 26vw below the header icons |
| Garments visible | 3 whole garments plus slivers at both edges |
| Hanger spacing at rest | 326-330 px = **27.8vw** |
| Side-view garment | 17-19% of the viewport wide; hangs ~66vw from the rail to the hem |
| Centred front view | 44% of the viewport wide; same hem height as the side views (no extra scale) |
| Spacing around the centred front view | neighbours pushed out to 456-458 px (38.7vw) from it: **+10.9vw** each side; garments further out shift by the same amount |
| Drag | follows the finger 1:1 |
| Glide after release | exponential decay, **ratio 0.715 per 33.3 ms = time constant ~100 ms**; from 86 px/frame to rest in ~430 ms (12-13 steps); glide distance = release speed x 100 ms |
| Snap | no snap at the end of a glide (rests 8-44 px off centre); after a short dwell the garment nearest the centre is centred by an eased move (bell-shaped speed, **300 ms**, ease-in-out) |
| Side to front | starts **~300 ms** after the row comes to rest (rest at frame 289, spread starts 308); neighbours spread over ~400 ms (ease-out); the side photo **cross-fades** to the front photo (not a 3D turn) in **~100 ms**, starting ~100 ms into the spread |
| Centre | the garment nearest the screen centre when the row stops |
| Ends | never reached in the reel (it loops back to its first frame, which is what reads as "returning to the first garment"): end behaviour cannot be measured |
| Sway | yes: a damped pendulum about the hook. Period ~1.37 s, peak ~3.9 deg (27 px hem offset over 400 px), damping ratio ~0.2 (about half the amplitude per half swing); the hem lags when the row speeds up and swings forward when it slows |
| Tap on the centred garment | opens the focus view (Close, Front / Back, "05 / 10", name, price) |
| Indicators | the dots under the reel belong to the reel itself, not the page |

## v5: hero-to-pants entry veil (measured October 26)

`video-b-full-reel.mov`, 0.3-1.1 s: where the reference's white section rises over its dark hero,
the luminance on a column over the curtain steps from the hero (~105-115) to the section (~210-225 on
camera) within ~6 px of an ~800 px screen: under 1% of the screen height. No grey haze above the
edge. Ours had a 30vh feather in a tinted sky (#F0F3F6) plus a 26vh mist band: darkest veil tone
4.0-4.3% grey. Now: 8vh white fade, white-to-white sky (#F9FAFB -> #FDFDFD), mist band 10vh at 60%,
clouds 45% / 40%: darkest tone 2.0-2.6% grey at the start, middle and end of the entry.
