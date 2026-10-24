/**
 * CAPS / HEADWEAR DATA: exactly the 4 products of the real collection (/collections/headwear),
 * with live names, ₦ prices, links and photos. In Shopify this comes from the collection.
 */
export type CapItem = {
  name: string;
  price: string;
  url: string;
  image: string;
  /** Second photo, shown on hover; null when the product has only one usable photo. */
  hover: string | null;
};

const STORE = "https://www.unk-nown.com";
const IMG = "/products/unknown/caps";

export const CAPS = {
  label: "Headwear",
  title: "Caps",
  collectionUrl: `${STORE}/collections/headwear`,
};

export const caps: CapItem[] = [
  { name: "UNKNOWN SV SNAPBACK RED", price: "₦70,000", url: `${STORE}/products/unknown-sv-snapback-red`, image: `${IMG}/unknown-sv-snapback-red-1.webp`, hover: `${IMG}/unknown-sv-snapback-red-3.webp` },
  { name: "UNKNOWN VRS", price: "₦100,000", url: `${STORE}/products/unknown-vrs-snapback`, image: `${IMG}/unknown-vrs-snapback-1.webp`, hover: `${IMG}/unknown-vrs-snapback-2.webp` },
  { name: "UNKNOWN SV SNAPBACK BLACK", price: "₦70,000", url: `${STORE}/products/unknown-sv-snapback-black-1`, image: `${IMG}/unknown-sv-snapback-black-1-1.webp`, hover: null },
  { name: "UNKNOWN FUR CLOUD BEANIE", price: "₦80,000", url: `${STORE}/products/unknown-fur-cloud-beanie`, image: `${IMG}/unknown-fur-cloud-beanie-1.webp`, hover: null },
];
