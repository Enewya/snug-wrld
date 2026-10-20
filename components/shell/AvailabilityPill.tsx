import { CHECKOUT_URL } from "@/lib/brand";

export default function AvailabilityPill({ hidden = false }: { hidden?: boolean }) {
  return (
    <a
      href={CHECKOUT_URL}
      target="_blank"
      rel="noopener"
      tabIndex={hidden ? -1 : undefined}
      className={`absolute left-1/2 top-[90%] z-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink px-[19px] py-[5px] text-[12px] font-medium uppercase tracking-[0.04em] text-ink transition-opacity duration-300 ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      See Availability
    </a>
  );
}
