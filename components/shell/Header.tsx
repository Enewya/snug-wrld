import Image from "next/image";
import { LOGO } from "@/lib/brand";

const linkClass = "text-[12px] font-medium uppercase tracking-[0.08em] text-ink";
const fade = "transition-opacity duration-300";

/** In the focus view ABOUT and the logo fade out and CONTACT becomes CLOSE ✕ in the same spot (bm-09). */
export default function Header({ focus = false, onClose }: { focus?: boolean; onClose?: () => void }) {
  const away = focus ? "pointer-events-none opacity-0" : "opacity-100";
  return (
    <header className="absolute inset-x-0 top-0 z-50 grid h-[10.4vh] min-h-[64px] grid-cols-[1fr_auto_1fr] items-center px-[2.2vw]">
      <a href="#about" className={`${linkClass} ${fade} ${away} justify-self-start`} tabIndex={focus ? -1 : undefined}>
        About
      </a>
      <Image
        src={LOGO.src}
        width={LOGO.width}
        height={LOGO.height}
        alt={LOGO.alt}
        preload
        className={`${fade} ${away}`}
        style={{ height: LOGO.displayHeight, width: "auto" }}
      />
      <div className="relative justify-self-end">
        <a href="#contact" className={`${linkClass} ${fade} ${away} block`} tabIndex={focus ? -1 : undefined}>
          Contact
        </a>
        <button
          type="button"
          onClick={onClose}
          className={`${linkClass} ${fade} absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-[10px] whitespace-nowrap ${
            focus ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          tabIndex={focus ? undefined : -1}
          aria-hidden={!focus}
          aria-label="Close detail view"
          style={{ minHeight: 48, minWidth: 48, justifyContent: "flex-end" }}
        >
          Close <span aria-hidden="true" className="text-[13px] font-semibold">✕</span>
        </button>
      </div>
    </header>
  );
}
