/**
 * CURRENCY DATA. Checked against https://www.unk-nown.com on 27 Oct 2026:
 * - shop currency NGN (/meta.json, /cart.js);
 * - Shopify Markets countries: Canada, Nigeria, United States, but every one of them checks out in
 *   NGN (cart.js currency stays NGN with ?country=US / ?currency=USD and with the localization
 *   cookies), and products ship to NG only;
 * - the store's on-page selector is a client-side converter app (Bucks), not Shopify currencies.
 * So the store's real currency list is NGN alone. `placeholder: false`: nothing here is invented.
 * No conversion and no rates anywhere: choosing a currency only records the choice.
 * In Shopify the list comes from localization.available_countries (see currency-behaviour.js).
 */
export type Currency = { code: string; name: string };

export const CURRENCY = {
  label: "Currency",
  default: "NGN",
  placeholder: false,
  storageKey: "unk-currency",
  currencies: [{ code: "NGN", name: "Nigerian naira" }] as Currency[],
};
