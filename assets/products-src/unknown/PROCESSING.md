# UNKNOWN asset preparation

33 original PNGs copied byte-for-byte from the supplied unknown-hanger-assets folder (11 garments × front, side, back). Original README.txt retained.

Prepared using the workflow in scripts/cutout.mjs and scripts/optimize-images.mjs at main commit 395c178:
- Scope input to assets/products-src/unknown and cutout output to its cut/ subfolder.
- Apply the existing Apple Vision + border flood-fill cutout algorithm to ALL 33 views, including backs: these originals all have opaque backgrounds.
- Encode all cut/*.png to public/products/unknown/<same-name>.webp using the existing quality ladder 82/76/70, alphaQuality 90, effort 6, smartSubsample true, and 200 KiB budget. No resizing or cropping.
- Temporary scoped copies of the scripts were used; shared scripts were not modified.

Validation: 33 matching originals, cutouts, and WebPs; every WebP is 1086 × 1448, contains transparency, and is below 200 KiB. Total website image size: 2.43 MiB. Contact sheet visually checked.

Hook measurements and product registration are deferred: scripts/measure-hooks.mjs writes lib/products.ts and currently scans only the top-level public/products directory. Before using these on the rack, measure the UNKNOWN hooks and garment bounds, review alignment, and register the images in the prototype. The hero and product list have not been changed.

## Round 9: white Tranquility mesh tee (UNKNOWN ORIGINAL TRANQUILITY JERSEY)

- Originals: the three supplied images, byte-for-byte, as white-tranquility-mesh-tee-{front,side,back}.webp (supplied as WebP; front 1087 × 1447, side and back 1086 × 1448).
- Cut-out: Apple Vision is not available on the Linux build machine, so the masks were made with rembg BiRefNet (`birefnet-general`), kept in masks/. The hook wire survived the cut in all three views. cut/*.png = original RGB + mask.
- Canvas: the front was put on the standard 1086 × 1448 canvas (its last column was fully transparent and dropped; one transparent row added at the bottom). No rescale.
- Measured against the existing 33 before processing: garment + hanger height share 0.913 / 0.932 / 0.916 (front / side / back; existing 0.82–0.93), hook x 544 / 536 (existing 531–540), background #e5e4e0–#e7e5e1 (existing #e5e4e0–#e7e6e4). Hook-to-hem height 1290 / 1318 / 1294 px vs the other tees' 1287–1294 / 1289–1326 / 1283–1294: garment scale already matched, so no scale change.
- Hanger normalised with scripts/normalise-unknown-hanger.py:
  - hook: the wire hook was ~19% larger than every other garment's (apex to neck 125 px vs 103–116, loop gap 40 px vs 28–32). Rows above the walnut neck scaled by 0.848 / 0.864 / 0.856 about the neck join; now 106 / 108 / 107 px (loop gap 35 / 36 / 35 px, slightly more open than the others' 28–32).
  - wood: this hanger is a darker walnut (mean RGB 120,68,39 vs 155,98,68); the wood pixels were colour-matched to the blue striped tee's hanger of the same view.
  - Not changed: the neck block is a slightly different hanger model (rounder top, front neck 74–101 px wide vs 81–114 px); at rack size the difference is about 1–2 px.
- Lettering checked against the store's product photos: "TRANQUILITY" and "unknown" are correct.
- Encoded with the same ladder (quality 82, alphaQuality 90, effort 6): 128 / 68 / 123 KB. Hooks measured with scripts/measure-unknown-hooks.mjs.
