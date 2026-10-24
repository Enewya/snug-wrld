# UNKNOWN asset preparation

33 original PNGs copied byte-for-byte from the supplied unknown-hanger-assets folder (11 garments × front, side, back). Original README.txt retained.

Prepared using the workflow in scripts/cutout.mjs and scripts/optimize-images.mjs at main commit 395c178:
- Scope input to assets/products-src/unknown and cutout output to its cut/ subfolder.
- Apply the existing Apple Vision + border flood-fill cutout algorithm to ALL 33 views, including backs: these originals all have opaque backgrounds.
- Encode all cut/*.png to public/products/unknown/<same-name>.webp using the existing quality ladder 82/76/70, alphaQuality 90, effort 6, smartSubsample true, and 200 KiB budget. No resizing or cropping.
- Temporary scoped copies of the scripts were used; shared scripts were not modified.

Validation: 33 matching originals, cutouts, and WebPs; every WebP is 1086 × 1448, contains transparency, and is below 200 KiB. Total website image size: 2.43 MiB. Contact sheet visually checked.

Hook measurements and product registration are deferred: scripts/measure-hooks.mjs writes lib/products.ts and currently scans only the top-level public/products directory. Before using these on the rack, measure the UNKNOWN hooks and garment bounds, review alignment, and register the images in the prototype. The hero and product list have not been changed.
