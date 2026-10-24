// Finds the hook loop and garment bounds in a hanger photo's alpha channel. Shared by
// scripts/measure-hooks.mjs (the Next site, at build time) and the Shopify rack (in the browser).
//
// `data` is RGBA bytes, W×H. Every value returned is in image pixels:
//   apexX/apexY      crest of the hook (top-most opaque row, centre of its pixels)
//   cx               horizontal centre of the curl (tip ball to the far side of the arc)
//   innerTop         first empty row inside the curl, under the arc, at cx
//   innerBottom      bottom of the gap: the S-bend crossing back at cx, or just below the ball tip
//   neckY            top of the walnut neck (where the hook enters the wood)
//   bottom           lowest opaque row
//   shoulder         {y, x0, x1}: the widest row in the garment's top third
//   left/right       horizontal alpha bounds of the garment below the hanger neck
// The pixel constants are tuned for photos 1086px wide; scale photos to that width first.

export const MEASURE_WIDTH = 1086;

const OPAQUE = 128;
/** The wire's bright highlight is partly keyed out by the cutout; bridge holes this small. */
const BRIDGE = 3;

export function measure(data, W, H) {
  const op = (x, y) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3] > OPAQUE;
  const rowXs = (y, x0 = 0, x1 = W - 1) => { const xs = []; for (let x = x0; x <= x1; x++) if (op(x, y)) xs.push(x); return xs; };

  let apexY = 0;
  while (apexY < H && rowXs(apexY).length === 0) apexY++;
  const top = rowXs(apexY);
  const apexX = Math.round((top[0] + top[top.length - 1]) / 2);

  // neck: first row of 12 in a row whose widest solid run near the hook is wider than the wire
  const solidRun = (y) => {
    let best = 0, start = -1;
    for (let x = apexX - 120; x <= apexX + 120; x++) {
      if (op(x, y)) { if (start < 0) start = x; best = Math.max(best, x - start + 1); } else start = -1;
    }
    return best;
  };
  let neckY = apexY;
  while (neckY < apexY + 500 && ![...Array(12).keys()].every((k) => solidRun(neckY + k) > 24)) neckY++;

  // curl extent: upper 60% of the hook
  let minX = W, maxX = 0;
  for (let y = apexY; y < apexY + (neckY - apexY) * 0.6; y++) {
    const xs = rowXs(y, apexX - 150, apexX + 150);
    if (xs.length) { minX = Math.min(minX, xs[0]); maxX = Math.max(maxX, xs[xs.length - 1]); }
  }
  const cx = Math.round((minX + maxX) / 2);

  // scan down a 3px column at cx: arc wire, then the gap, then the S-bend
  const col = (y) => op(cx - 1, y) || op(cx, y) || op(cx + 1, y);
  const colBridged = (y) => [...Array(BRIDGE + 1).keys()].some((k) => col(y + k)) && col(y - 1) ? true : col(y);
  let y = apexY;
  while (y < neckY && !col(y)) y++; // the crest may sit off the centre column
  while (y < neckY && colBridged(y)) y++;
  const innerTop = y;
  while (y < neckY && !col(y)) y++;
  const sBend = y;
  // bottom of the ball tip: the tip hangs on one side of the curl (left or right, depending on the
  // photo); on the other side the wire runs on down into the stem. Take the side that ends first.
  const sideBottom = (x0, x1) => {
    let b = innerTop;
    for (let yy = innerTop; yy < sBend; yy++) if (rowXs(yy, Math.round(x0), Math.round(x1)).length) b = yy;
    return b;
  };
  const q = (maxX - minX) * 0.25;
  const tipBottom = Math.min(sideBottom(minX, minX + q), sideBottom(maxX - q, maxX));
  // the inner gap ends at whichever comes first: the S-bend crossing back, or just below the tip
  const innerBottom = Math.min(sBend, tipBottom + 2);

  let bottom = 0;
  for (let yy = H - 1; yy >= 0 && !bottom; yy--) if (rowXs(yy).length) bottom = yy;
  // horizontal alpha bounds of the whole garment (below the hanger neck)
  let left = W, right = 0;
  for (let yy = neckY; yy <= bottom; yy += 2) {
    const xs = rowXs(yy);
    if (xs.length) { left = Math.min(left, xs[0]); right = Math.max(right, xs[xs.length - 1]); }
  }

  // shoulder line: the widest row in the top third of the garment (below the hanger neck)
  let shoulder = { y: neckY, x0: 0, x1: 0 };
  for (let yy = neckY; yy < neckY + (bottom - neckY) * 0.35; yy += 2) {
    const xs = rowXs(yy);
    if (xs.length && xs[xs.length - 1] - xs[0] > shoulder.x1 - shoulder.x0) shoulder = { y: yy, x0: xs[0], x1: xs[xs.length - 1] };
  }
  return { apexX, apexY, cx, innerTop, innerBottom, neckY, bottom, shoulder, left, right };
}

