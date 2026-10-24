/**
 * CAPS / HEADWEAR DATA. In Shopify this is fed by the store's caps/headwear collection (its handle
 * is not confirmed yet: see HANDOFF.md) with product blocks for the featured pieces.
 *
 * PLACEHOLDER DATA: no cap photography or product data could be fetched from the build
 * environment, so the three tiles are labelled placeholders. Replace name, price, url and image.
 */
export type CapItem = {
  name: string | null;
  price: string | null;
  url: string | null;
  /** null = draw the labelled placeholder tile */
  image: string | null;
};

export const CAPS = {
  label: "Headwear",
  title: "Caps",
  intro: null as string | null, // add the client's own line here; nothing invented
  collectionUrl: null as string | null, // e.g. /collections/caps once confirmed
  placeholder: true,
};

export const caps: CapItem[] = [
  { name: null, price: null, url: null, image: null },
  { name: null, price: null, url: null, image: null },
  { name: null, price: null, url: null, image: null },
];
