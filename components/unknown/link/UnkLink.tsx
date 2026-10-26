/**
 * The one text link of the UNKNOWN site ("View all", "View product", "Get directions"): a single
 * <a> with plain text, no arrow. The underline sits under the text only and draws in from the left
 * on hover; the link is a 48px touch target. Styles: components/unknown/section.css (.unk-link).
 * In Liquid: snippets/unk-link.liquid with the same markup.
 */
type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className"> & {
  href: string;
  children: React.ReactNode;
  /** External links open in a new tab and say so to screen readers. */
  external?: boolean;
  className?: string;
};

/** Other attributes (aria-label, tabIndex, data-*) go straight onto the <a>. */
export default function UnkLink({ href, children, external, className, ...rest }: Props) {
  return (
    <a className={`unk-link${className ? ` ${className}` : ""}`} href={href}
      {...(external ? { target: "_blank", rel: "noopener" } : {})} {...rest}>
      <span className="unk-link__text">{children}</span>
      {external && <span className="unk-sr"> (opens in a new tab)</span>}
    </a>
  );
}
