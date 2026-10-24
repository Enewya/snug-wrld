/**
 * NEW ARRIVALS DATA: the first 8 products of the real collection (/collections/new-arrival), in
 * the store's order, with live names, ₦ prices, links and photos (fetched from the store and
 * optimised by scripts/optimize-unknown-store-photos.mjs). In Shopify this list comes from the
 * collection itself.
 */
export type ArrivalItem = {
  name: string;
  price: string;
  url: string;
  image: string;
  /** Second photo, shown on hover; null when the product has only one. */
  hover: string | null;
};

const STORE = "https://www.unk-nown.com";
const IMG = "/products/unknown/new-arrival";

export const NEW_ARRIVALS = {
  label: "Just in",
  title: "New Arrivals",
  collectionUrl: `${STORE}/collections/new-arrival`,
};

export const arrivals: ArrivalItem[] = [
  { name: "UNKNOWN C DOVE VEST", price: "₦125,000", url: `${STORE}/products/unknown-c-dove-vest`, image: `${IMG}/unknown-c-dove-vest-1.webp`, hover: `${IMG}/unknown-c-dove-vest-2.webp` },
  { name: "UNKNOWN SKY TIME SHORT", price: "₦100,000", url: `${STORE}/products/unknown-sky-time-short`, image: `${IMG}/unknown-sky-time-short-1.webp`, hover: `${IMG}/unknown-sky-time-short-2.webp` },
  { name: "UNKNOWN DZR HOODIE", price: "₦150,000", url: `${STORE}/products/unknown-dzr-hoodie`, image: `${IMG}/unknown-dzr-hoodie-1.webp`, hover: `${IMG}/unknown-dzr-hoodie-2.webp` },
  { name: "UNKNOWN VRS", price: "₦100,000", url: `${STORE}/products/unknown-vrs-snapback`, image: `${IMG}/unknown-vrs-snapback-1.webp`, hover: `${IMG}/unknown-vrs-snapback-2.webp` },
  { name: "UNKNOWN VCA STRIKE", price: "₦100,000", url: `${STORE}/products/unknown-vca-strike-shirt`, image: `${IMG}/unknown-vca-strike-shirt-1.webp`, hover: `${IMG}/unknown-vca-strike-shirt-2.webp` },
  { name: "UNKNOWN SIDE EYE BAGGY PANT", price: "₦100,000", url: `${STORE}/products/unknown-side-eye-baggy-pant`, image: `${IMG}/unknown-side-eye-baggy-pant-1.webp`, hover: `${IMG}/unknown-side-eye-baggy-pant-2.webp` },
  { name: "UNKNOWN HARDCORE BAGGY DENIM JEAN", price: "₦145,000", url: `${STORE}/products/unknown-denim-jean`, image: `${IMG}/unknown-denim-jean-1.webp`, hover: null },
  { name: "UNKNOWN ORIGINAL TRANQUILITY JERSEY", price: "₦100,000", url: `${STORE}/products/unknown-original-tranquility-jersey`, image: `${IMG}/unknown-original-tranquility-jersey-1.webp`, hover: `${IMG}/unknown-original-tranquility-jersey-2.webp` },
];
