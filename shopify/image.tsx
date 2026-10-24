/**
 * Stands in for next/image in the Shopify bundle. Each photo is shown from the exact URL the rack
 * measured it from (shopify/products.ts), fetched the same way (CORS), so the browser reuses that
 * download and every garment appears at once. Shopify's CDN already serves it as WebP/AVIF.
 */
import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> & {
  src: string;
  width: number;
  height: number;
  /** next/image's high-priority hint. */
  preload?: boolean;
};

export default function Image({ src, width, height, preload, alt = "", ...rest }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- this is the next/image replacement
    <img
      src={src}
      crossOrigin="anonymous"
      width={width}
      height={height}
      alt={alt}
      decoding="async"
      fetchPriority={preload ? "high" : undefined}
      {...rest}
    />
  );
}
