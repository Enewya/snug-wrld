import Image from "next/image";
import UnkLink from "../link/UnkLink";
import { TWO_PIECE } from "./two-piece.data";
import "./two-piece-styles.css";

/**
 * Two Piece: one product as an editorial moment. A large 4:5 photo cropped to the figure, the
 * details beside it on expanded widths and under it on compact. The store has one photo for this
 * product, so there is nothing to swap (with two or more, swap them on hover / tap).
 */
export default function TwoPiece() {
  const photo = TWO_PIECE.photos[0];
  const { x, y, w, h } = photo.crop;
  // place the full photo so the crop box fills the 4:5 well exactly
  const frame = {
    width: `${(photo.width / w) * 100}%`,
    left: `${(-x / w) * 100}%`,
    top: `${(-y / h) * 100}%`,
  };
  return (
    <section className="unk-section unk-two" aria-labelledby="unk-two-title">
      <div className="unk-wrap unk-two__grid">
        <a className="unk-two__well" href={TWO_PIECE.url} tabIndex={-1} aria-hidden="true">
          <Image className="unk-two__img" src={photo.src} alt="" width={photo.width} height={photo.height}
            sizes="(max-width: 599px) 144vw, (max-width: 839px) 90vw, 60vw" style={frame}
            // 32 KB: loaded up front at low priority, so it is never a late, lazy LCP candidate
            loading="eager" fetchPriority="low" />
        </a>
        <div className="unk-two__details" data-reveal>
          <span className="unk-two__label">{TWO_PIECE.label}</span>
          <h2 id="unk-two-title" className="unk-two__name">{TWO_PIECE.name}</h2>
          <p className="unk-two__price">{TWO_PIECE.price}</p>
          <span className="unk-two__link"><UnkLink href={TWO_PIECE.url}>{TWO_PIECE.linkText}</UnkLink></span>
          <span className="unk-sr">{photo.alt}</span>
        </div>
      </div>
    </section>
  );
}
