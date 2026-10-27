/** Phone rack swipe hint: copy, timings and behaviour switches. In the theme: section settings. */
export const SWIPE_HINT = {
  label: "Swipe to explore",
  /** Only on touch screens (no hover, or a coarse pointer). */
  media: "(hover: none), (pointer: coarse)",
  /** The hero counts as visible at this share on screen... */
  visibleRatio: 0.6,
  /** ...and as settled once it has stayed visible this long with the page loaded (ms). */
  settleMs: 400,
  /** The physical nudge: the row drifts this far (px, negative = left) and springs back. */
  nudgePx: -24,
  nudgeOutMs: 240, // M3 emphasized decelerate
  nudgeBackMs: 360, // M3 emphasized; 600ms in all
  /** Label: appears this long after the hero is visible and settled... */
  labelDelayMs: 1200,
  /** ...and leaves on the first drag or after this long, whichever comes first. */
  labelMs: 6000,
  fadeMs: 200,
  /** Untouched for this long after the label has gone: one more nudge, label for repeatLabelMs, then stop. */
  idleRepeatMs: 8000,
  repeatLabelMs: 3000,
  /** prefers-reduced-motion: no nudge, no chevron pulse; the label shows this long, once. */
  reducedLabelMs: 5000,
  /** After one successful swipe the hint never shows again for this many days (localStorage). */
  storageKey: "unk-swipe-hint-done",
  quietDays: 30,
} as const;
