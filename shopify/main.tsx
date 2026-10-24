/**
 * Entry point of assets/rack-hero.js: mounts the rack into the Rack hero section. The rack's
 * product data is module-wide (shopify/products.ts), so a page shows one rack: the first section.
 */
import { createRoot, type Root } from "react-dom/client";
import RackHero from "./RackHero";
import { loadRack, products, type RackInput } from "./products";

let mounted: { section: HTMLElement; root: Root } | null = null;

async function mount(section: HTMLElement) {
  if (mounted) return;
  const json = section.querySelector<HTMLScriptElement>("script[data-rack-hero-data]");
  const stage = section.querySelector<HTMLElement>(".rack-hero-stage");
  if (!json || !stage) return;
  const root = createRoot(stage);
  mounted = { section, root };
  await loadRack(JSON.parse(json.textContent || "[]") as RackInput[]);
  if (mounted?.root !== root) return; // unmounted while the photos loaded
  section.style.setProperty("--n", String(products.length));
  const paper = getComputedStyle(section).getPropertyValue("--rack-bg").trim() || "#e9e8e4";
  // the colourway tint reaches every wall on the page: the hero's and the Snug header's above it
  const onWall = (colour: string | null) => {
    for (const wall of [stage, document.querySelector<HTMLElement>(".snug-header")]) {
      if (wall) wall.style.backgroundColor = colour ?? "";
    }
  };
  root.render(<RackHero paper={paper} onWall={onWall} />);
  section.classList.add("is-ready");
}

function unmount(section: Element) {
  if (!mounted || !section.contains(mounted.section)) return;
  mounted.root.unmount();
  mounted = null;
}

function mountFirst() {
  const section = document.querySelector<HTMLElement>("[data-rack-hero]");
  if (section) void mount(section);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountFirst);
else mountFirst();

// theme editor: sections are re-rendered in place when their settings change
document.addEventListener("shopify:section:unload", (e) => unmount(e.target as Element));
document.addEventListener("shopify:section:load", mountFirst);
