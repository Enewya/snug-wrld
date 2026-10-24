/** Shared renderer metadata; neither brand's product list is mutated. */
import { photos as snugPhotos, photoScale as snugScale } from "./products";
import { photos as unknownPhotos } from "./unknown-photos";
export const photos = { ...snugPhotos, ...unknownPhotos };
export const photoScale = { ...snugScale };
// Use hook-centre to hem length so switching views preserves the visible hanging height.
for (const src of Object.keys(unknownPhotos)) {
  const m = unknownPhotos[src];
  const side = unknownPhotos[src.replace(/-(front|back)\.webp$/, "-side.webp")];
  const height = (p: typeof m) => p.garmentBottomY - (p.loopInnerTopY + p.loopInnerBottomY) / 2;
  photoScale[src] = height(side) / height(m);
}
