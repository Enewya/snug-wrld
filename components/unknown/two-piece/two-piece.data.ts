/**
 * TWO PIECE DATA: the one product in the live homepage's "Two Piece" section
 * (https://www.unk-nown.com, checked 26 Oct 2026). Name, price and link from the store's product
 * JSON; the store has one photo for it (reference/two-piece/, served WebP from
 * scripts/optimize-unknown-store-photos.mjs). In Shopify: a section with one product picker.
 */
const STORE = "https://www.unk-nown.com";

export const TWO_PIECE = {
  label: "Two piece",
  name: "UNKNOWN JT LOGO PIECE",
  price: "₦120,000",
  url: `${STORE}/products/unknown-jt-logo-piece`,
  linkText: "View product",
  photos: [
    {
      src: "/products/unknown/two-piece/unknown-jt-logo-piece-3923475.webp",
      width: 1500,
      height: 1500,
      alt: "UNKNOWN JT LOGO PIECE: black tee and matching trousers with white and light-blue panels, worn",
      // the 4:5 crop that frames the figure, in source pixels (the photo has wide white margins)
      crop: { x: 235, y: 150, w: 1040, h: 1300 },
    },
  ],
};
