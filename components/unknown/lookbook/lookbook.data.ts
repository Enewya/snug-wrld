/**
 * LOOKBOOK DATA: the real photos from https://www.unk-nown.com/pages/unknown-lookbook, in the
 * page's order (optimised by scripts/optimize-unknown-store-photos.mjs). The page links no photo
 * to a product; `product` is set only where the photo's own file name names it on the store
 * (3 looks). The rest link to the full lookbook. In Shopify: one block per look.
 */
export type Look = {
  src: string;
  width: number;
  height: number;
  /** The product shown, when known; otherwise the look links to the lookbook page. */
  product: { name: string; url: string } | null;
};

const STORE = "https://www.unk-nown.com";
const IMG = "/products/unknown/lookbook";

export const LOOKBOOK = {
  label: "Worn in Lagos",
  title: "Lookbook",
  pageUrl: `${STORE}/pages/unknown-lookbook`,
};

export const looks: Look[] = [
  { src: `${IMG}/01-IMG_3566.webp`, width: 750, height: 900, product: null },
  { src: `${IMG}/02-IMG_6487.webp`, width: 927, height: 1600, product: null },
  { src: `${IMG}/03-IMG_0599.webp`, width: 1179, height: 1423, product: null },
  { src: `${IMG}/04-unknown-original-tranquility-jersey-7236765.webp`, width: 731, height: 1600, product: { name: "UNKNOWN ORIGINAL TRANQUILITY JERSEY", url: `${STORE}/products/unknown-original-tranquility-jersey` } },
  { src: `${IMG}/05-unknown-ligne-noire-hoodie-7039507.webp`, width: 1600, height: 1600, product: { name: "UNKNOWN LIGNE NOIRE HOODIE", url: `${STORE}/products/unknown-ligne-noire-hoodie` } },
  { src: `${IMG}/06-IMG_4379.webp`, width: 900, height: 1600, product: null },
  { src: `${IMG}/07-IMG_4381.webp`, width: 900, height: 1600, product: null },
  { src: `${IMG}/08-unknown-shhshhsh-jersey-2909849.webp`, width: 1600, height: 1600, product: { name: "UNKNOWN SHHSHHSH JERSEY", url: `${STORE}/products/unknown-shhshhsh-jersey` } },
  { src: `${IMG}/09-IMG_0251.webp`, width: 1236, height: 1600, product: null },
  { src: `${IMG}/10-IMG_6756.webp`, width: 961, height: 1600, product: null },
  { src: `${IMG}/11-IMG_7203.webp`, width: 1238, height: 1600, product: null },
  { src: `${IMG}/12-IMG_8558.webp`, width: 929, height: 1600, product: null },
  { src: `${IMG}/13-IMG_8616.webp`, width: 1027, height: 1532, product: null },
  { src: `${IMG}/14-IMG_2481.webp`, width: 798, height: 1600, product: null },
];
