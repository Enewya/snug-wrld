import "./swipe-hint.css";

/** Markup only: label + chevrons. Timing lives in swipe-hint-behaviour.js, copy in swipe-hint.data.ts. */
export default function SwipeHint({ ref }: { ref?: React.Ref<HTMLParagraphElement> }) {
  const chev = (d: string, side: "l" | "r") => (
    <svg className={`ush__chev ush__chev--${side}`} viewBox="0 0 12 12" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <p ref={ref} className="ush" aria-live="polite">
      {chev("M7.5 2.5 4 6l3.5 3.5", "l")}
      <span data-ush-text />
      {chev("M4.5 2.5 8 6 4.5 9.5", "r")}
    </p>
  );
}
