/**
 * The one text link of the UNKNOWN site: a single <a>, text underlined (text only, not the icon
 * or the gap), a 6px gap, then a top-right arrow. Hover: the arrow nudges 2px up-right and the
 * underline draws in from the left. Styles: components/unknown/section.css (.unk-link).
 * In Liquid: snippets/unk-link.liquid with the same markup.
 */
type Props = {
  href: string;
  children: React.ReactNode;
  /** External links open in a new tab and say so to screen readers. */
  external?: boolean;
  className?: string;
};

export default function UnkLink({ href, children, external, className }: Props) {
  return (
    <a className={`unk-link${className ? ` ${className}` : ""}`} href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}>
      <span className="unk-link__text">{children}</span>
      <svg className="unk-link__icon" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
        <path d="M2.5 7.5l5-5M3.5 2.5h4v4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {external && <span className="unk-sr"> (opens in a new tab)</span>}
    </a>
  );
}
