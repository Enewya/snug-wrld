"use client";

type Props = {
  name: string;
  url: string;
  /** Which photo the pill shows as selected. Comes only from FRONT / BACK clicks (never the turn). */
  face: "front" | "back";
  /** Slide the knob (a click) or move it instantly (reset on a product switch). */
  animateFace: boolean;
  /** No back photo: no FRONT / BACK pill. */
  hasBack: boolean;
  onFace: (back: boolean) => void;
};

/** Info under the garment: name, FRONT / BACK pill, availability link. (The colour name is shown
 *  by the swing tags.) */
export default function InfoStack({ name, url, face, animateFace, hasBack, onFace }: Props) {
  const back = face === "back";
  return (
    <div className="info">
      <h2 className="info-name">{name}</h2>
      {hasBack && (
        <div className={`seg${animateFace ? " seg-animate" : ""}`} role="group" aria-label="View">
          <span className="seg-knob" style={{ transform: back ? "translateX(100%)" : "translateX(0)" }} />
          <button type="button" className={back ? "" : "lit"} aria-pressed={!back} onClick={() => onFace(false)}>
            FRONT
          </button>
          <button type="button" className={back ? "lit" : ""} aria-pressed={back} onClick={() => onFace(true)}>
            BACK
          </button>
        </div>
      )}
      <a className="info-cta" href={url} target="_blank" rel="noopener">
        SEE AVAILABILITY ↗
      </a>
    </div>
  );
}
