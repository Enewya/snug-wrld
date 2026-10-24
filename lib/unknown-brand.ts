/**
 * UNKNOWN brand assets and facts for the /unknown prototype.
 * The wordmark file is a PLACEHOLDER (the real logo could not be fetched from the build
 * environment): drop the real artwork in at the same path and update width/height.
 */
export const UNKNOWN_LOGO = {
  src: "/products/unknown/brand/unknown-wordmark.svg",
  width: 320,
  height: 64,
  alt: "UNKNOWN",
  placeholder: true,
};

/** Real store facts (from the client); used by the visit section and the footer. */
export const UNKNOWN_STORE = {
  name: "UNKNOWN",
  city: "Lagos",
  address: ["1st Floor, Park Place", "19 Admiralty Way", "Lagos"],
  hours: "Open Mon–Sun, 9am–7pm",
  emailCopy: "Get exclusive deals and early access to new products",
  site: "https://www.unk-nown.com",
};
