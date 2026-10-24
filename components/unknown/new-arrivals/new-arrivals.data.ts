/**
 * NEW ARRIVALS DATA. In Shopify this section is fed by the real collection
 * (/collections/new-arrival); this list only stands in for it in the prototype.
 *
 * PLACEHOLDER DATA: the live store could not be reached from the build environment, so these are
 * real UNKNOWN garments (the rack photos) under their working names, without prices or product
 * links. Replace with the collection's products (name, ₦ price, URL, two images) when porting.
 */
export type ArrivalItem = {
  name: string;
  /** Formatted price, or null while unknown (shown as "Price on store"). */
  price: string | null;
  url: string;
  image: string;
  /** Second image, shown on hover. */
  hover: string;
};

export const NEW_ARRIVALS = {
  label: "Just in",
  title: "New Arrivals",
  collectionUrl: "https://www.unk-nown.com/collections/new-arrival",
  placeholder: true,
};

const COLLECTION = NEW_ARRIVALS.collectionUrl;
const top = (slug: string, name: string): ArrivalItem => ({
  name,
  price: null,
  url: COLLECTION,
  image: `/products/unknown/${slug}-front.webp`,
  hover: `/products/unknown/${slug}-back.webp`,
});

export const arrivals: ArrivalItem[] = [
  top("black-jacket", "Black Graphic Jacket"),
  top("green-plaid-shirt", "Green Panel Plaid Shirt"),
  top("grey-zip-hoodie", "Grey Zip Hoodie"),
  top("orange-bird-vest", "Orange Bird Knit Vest"),
  top("blue-striped-tee", "Blue Striped Tee"),
  top("beige-panel-jacket", "Beige Panel Jacket"),
  top("ivory-hoodie", "Ivory Hoodie"),
  top("yellow-misunderstood-tee", "Yellow Misunderstood Tee"),
];
