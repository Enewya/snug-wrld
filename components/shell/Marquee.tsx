import { MARQUEE_TEXT } from "@/lib/brand";

const REPEAT = 8;

export default function Marquee() {
  const run = MARQUEE_TEXT.repeat(REPEAT);
  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 flex h-[4.3vh] min-h-[32px] items-center overflow-hidden bg-brand text-[14px] font-bold uppercase italic tracking-[0.06em] text-brand-ink"
      aria-label="It's us, never them. New drops. Lagos."
    >
      <div className="marquee-track" aria-hidden="true">
        <span>{run}</span>
        <span>{run}</span>
      </div>
    </div>
  );
}
