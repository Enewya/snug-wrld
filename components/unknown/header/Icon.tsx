import { createElement } from "react";

/** One Hugeicons icon from components/unknown/icon-paths.ts, drawn at 24px (M3 icon size). */
type IconNode = readonly (readonly [string, Record<string, string>])[];

export default function Icon({ paths, size = 24 }: { paths: IconNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true" focusable="false">
      {paths.map(([tag, attrs]) => createElement(tag, attrs))}
    </svg>
  );
}
