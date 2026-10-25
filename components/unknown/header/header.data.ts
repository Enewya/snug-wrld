/**
 * HEADER + MENU DATA: the real UNKNOWN store navigation (labels and order as in the brief, URLs
 * checked against https://www.unk-nown.com on 25 Oct 2026). In Shopify this is the `main-menu`
 * link list (linklists['main-menu']); the icon links are routes.search_url / routes.account_url /
 * routes.cart_url.
 */
const STORE = "https://www.unk-nown.com";

export type NavLink = { text: string; url: string; children?: NavLink[] };

export const NAV: NavLink[] = [
  {
    text: "Our Collections",
    url: `${STORE}/collections/all`,
    children: [
      { text: "Caps", url: `${STORE}/collections/headwear` },
      // The live store's own "Jackets" item links to "#": there is no jackets collection yet
      // (/collections/jackets is a 404). Points at All until the collection exists.
      { text: "Jackets", url: `${STORE}/collections/all` },
      { text: "Shirts", url: `${STORE}/collections/shirts` },
      { text: "Pants", url: `${STORE}/collections/pants` },
      { text: "All", url: `${STORE}/collections/all` },
    ],
  },
  { text: "Best Sellers", url: `${STORE}/collections/best-sellers` },
  { text: "New Arrivals", url: `${STORE}/collections/new-arrival` },
  { text: "Look-Book", url: `${STORE}/pages/unknown-lookbook` },
  { text: "Contact", url: `${STORE}/pages/contact` },
  { text: "About Us", url: `${STORE}/pages/about-unknown` },
  { text: "Shop All", url: `${STORE}/collections/all` },
];

export const ABOUT = { text: "About", url: `${STORE}/pages/about-unknown` };

export const ICON_LINKS = {
  search: { label: "Search", url: `${STORE}/search` },
  account: { label: "Account", url: `${STORE}/account` },
  cart: { label: "Cart", url: `${STORE}/cart` },
};
