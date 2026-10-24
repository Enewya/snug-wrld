/**
 * Stands in for components/focus/InfoStack.tsx in the Shopify bundle: the same name, FRONT / BACK
 * pill and SEE AVAILABILITY link, plus the shop: price, colour and size, and ADD TO CART into the
 * theme's own cart (the same cart and checkout as the rest of the store). The colour follows the
 * swing tags; a product with more colours than photographed gets colour chips instead.
 */
import { useLayoutEffect, useRef, useState } from "react";
import { shop, type Product, type ShopData } from "./products";

type Props = {
  name: string;
  url: string;
  face: "front" | "back";
  animateFace: boolean;
  hasBack: boolean;
  onFace: (back: boolean) => void;
  product?: Product;
  colour?: number;
};

const NAME_PX = 24;
const NAME_MIN_PX = 18;
const DESKTOP = "(min-width: 641px)";

const isColour = (name: string) => /colou?r/i.test(name);
const isSize = (name: string) => /size/i.test(name);
/** Option values compared loosely: "Grey" matches "Gray", case and spaces don't matter. */
const same = (a: string, b: string) => {
  const n = (s: string) => s.toLowerCase().replace(/grey/g, "gray").replace(/\s+/g, "");
  return n(a) === n(b);
};

/** Cart routes from the section (they include the market's locale path). */
function cartRoutes() {
  const el = document.querySelector<HTMLElement>("[data-rack-hero]");
  return { add: el?.dataset.cartAdd ?? "/cart/add.js", cart: el?.dataset.cart ?? "/cart.js" };
}

/** Adds a variant to the cart, then tells the theme (cart icon, cart drawer) as its own forms do. */
async function addToCart(variantId: number) {
  const { add, cart } = cartRoutes();
  const sections = [...document.querySelectorAll<HTMLElement>("cart-items-component")]
    .map((el) => el.dataset.sectionId)
    .filter(Boolean);
  const body = new FormData();
  body.append("id", String(variantId));
  body.append("quantity", "1");
  if (sections.length) body.append("sections", sections.join(","));
  const res = await fetch(add, { method: "POST", body, headers: { Accept: "application/json" } });
  const json = await res.json();
  if (!res.ok || json.status) throw new Error(json.description || json.message || "Could not add to cart");
  const count = await fetch(cart, { headers: { Accept: "application/json" } })
    .then((r) => r.json())
    .then((c) => c.item_count as number)
    .catch(() => undefined);
  const event = new Event("cart:update", { bubbles: true }) as Event & { detail: unknown };
  event.detail = {
    resource: {},
    sourceId: String(variantId),
    data: { source: "rack-hero", itemCount: count, variantId: String(variantId), sections: json.sections },
  };
  document.dispatchEvent(event);
  // the detail view closes and the theme's cart drawer opens (RackHero.tsx)
  document.dispatchEvent(new CustomEvent("rack-hero:added"));
}

export default function ShopInfo({ name, url, face, animateFace, hasBack, onFace, product, colour = 0 }: Props) {
  const back = face === "back";
  const nameRef = useRef<HTMLHeadingElement>(null);
  const data: ShopData | undefined = product ? shop[product.slug] : undefined;

  useLayoutEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    const fit = () => {
      el.style.fontSize = "";
      if (!window.matchMedia(DESKTOP).matches) return;
      const room = el.clientWidth;
      const need = el.scrollWidth;
      if (need > room) el.style.fontSize = `${Math.max(NAME_MIN_PX, Math.floor((NAME_PX * room) / need))}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [name]);

  const options = data?.options ?? [];
  const variants = data?.variants ?? [];
  const colourAt = options.findIndex((o) => isColour(o.name));
  const sizeAt = options.findIndex((o) => isSize(o.name));
  const colourValues = colourAt >= 0 ? options[colourAt].values : [];
  const sizeValues = sizeAt >= 0 ? options[sizeAt].values : [];

  /** The colour the swing tags (or the garment's colour name) say is showing, as an option value. */
  const tagLabel = product?.colourways?.[colour]?.label ?? product?.colour;
  const tagValue = tagLabel ? colourValues.find((v) => same(v, tagLabel)) : undefined;
  /** Colour chips only when the swing tags can't pick every colour of the product. */
  const chips = colourValues.length > 1 && !(product?.colourways && product.colourways.length >= colourValues.length);

  /** What the shopper picked, for which product, and which swing tag was showing then: a new
   *  product starts with nothing picked, and a swing tag click overrides a picked colour chip. */
  const [picked, setPicked] = useState<{ slug?: string; tag?: string; colour?: string; size?: string }>({});
  const fresh = picked.slug === product?.slug;
  const pick = (p: { colour?: string; size?: string }) => setPicked({ slug: product?.slug, tag: tagValue, ...p });

  const firstInStock = colourValues.find((c) => variants.some((v) => v.options[colourAt] === c && v.available));
  const chipColour = fresh && picked.tag === tagValue ? picked.colour : undefined;
  const colourValue = chipColour || tagValue || firstInStock || colourValues[0];
  const ofColour = variants.filter((v) => colourAt < 0 || v.options[colourAt] === colourValue);
  /** Only one size of this colour: no need to ask. */
  const onlySize = sizeValues.length === 1 ? sizeValues[0] : undefined;
  const sizeValue = (fresh && picked.size) || onlySize;
  const variant = sizeAt < 0 ? ofColour[0] : ofColour.find((v) => v.options[sizeAt] === sizeValue);
  const shown = variant ?? ofColour[0] ?? variants[0];
  const soldOut = !ofColour.some((v) => v.available);

  const [state, setState] = useState<{ busy?: boolean; error?: string; key?: string }>({});
  const key = `${product?.slug}:${variant?.id}`;
  const error = state.key === key ? state.error : undefined;

  const label = !data
    ? ""
    : soldOut
      ? "SOLD OUT"
      : state.busy
        ? "ADDING…"
        : !variant
          ? "SELECT A SIZE"
          : !variant.available
            ? "SOLD OUT"
            : "ADD TO CART";
  const canAdd = !!variant && variant.available && !state.busy;

  const add = async () => {
    if (!variant || !canAdd) return;
    setState({ busy: true, key });
    try {
      await addToCart(variant.id);
      setState({ key });
    } catch (e) {
      setState({ key, error: e instanceof Error ? e.message : "Could not add to cart" });
    }
  };

  const sizesOfColour = sizeValues.map((s) => ({ s, available: ofColour.some((v) => v.options[sizeAt] === s && v.available) }));

  return (
    <div className="info shop-info">
      <h2 className="info-name" ref={nameRef}>
        {name}
      </h2>
      <p className="shop-price" aria-live="polite">
        {shown?.compare && <s>{shown.compare}</s>}
        {shown?.price}
      </p>
      <div
        className={`seg${animateFace ? " seg-animate" : ""}`}
        role="group"
        aria-label="Show front or back"
        style={hasBack ? undefined : { visibility: "hidden" }}
        aria-hidden={!hasBack}
      >
        <span className="seg-knob" style={{ transform: back ? "translateX(100%)" : "translateX(0)" }} />
        <button type="button" className={back ? "" : "lit"} aria-pressed={!back} onClick={() => onFace(false)} tabIndex={hasBack ? undefined : -1}>
          FRONT
        </button>
        <button type="button" className={back ? "lit" : ""} aria-pressed={back} onClick={() => onFace(true)} tabIndex={hasBack ? undefined : -1}>
          BACK
        </button>
      </div>
      <div className="shop-options">
        {colourValue && (
          <div className="shop-row" role="group" aria-label="Colour">
            {chips ? (
              colourValues.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`shop-chip${c === colourValue ? " on" : ""}`}
                  aria-pressed={c === colourValue}
                  onClick={() => pick({ colour: c, size: fresh ? picked.size : undefined })}
                >
                  {c}
                </button>
              ))
            ) : (
              <span className="shop-colour">{colourValue}</span>
            )}
          </div>
        )}
        {sizeValues.length > 1 && (
          <div className="shop-row" role="group" aria-label="Size">
            {sizesOfColour.map(({ s, available }) => (
              <button
                key={s}
                type="button"
                className={`shop-chip${s === sizeValue ? " on" : ""}${available ? "" : " out"}`}
                aria-pressed={s === sizeValue}
                aria-label={available ? `Size ${s}` : `Size ${s}, sold out`}
                disabled={!available}
                onClick={() => pick({ colour: chipColour, size: s })}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {data && (
        <button type="button" className="shop-add" disabled={!canAdd} onClick={add}>
          {label}
        </button>
      )}
      <p className="shop-error" role="alert">
        {error}
      </p>
      <a className="info-cta" href={url} aria-label={`See availability of ${name}`}>
        SEE AVAILABILITY
      </a>
    </div>
  );
}
