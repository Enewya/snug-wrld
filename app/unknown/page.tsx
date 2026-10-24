import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import UnknownShowroom from "@/components/unknown/UnknownShowroom";
import PantsSection from "@/components/unknown/pants-section/PantsSection";
import NewArrivals from "@/components/unknown/new-arrivals/NewArrivals";
import Caps from "@/components/unknown/caps/Caps";
import Lookbook from "@/components/unknown/lookbook/Lookbook";
import Visit from "@/components/unknown/visit/Visit";
import Footer from "@/components/unknown/footer/Footer";
import RevealInit from "@/components/unknown/reveal/RevealInit";
import "@/components/unknown/tokens.css";
import "@/components/unknown/section.css";
import "./unknown.css";

/* UNKNOWN type: Hanken Grotesk (Google Fonts, free), closest free match to the reference's
   neo-grotesque; see components/unknown/pants-section/HANDOFF.md. Scoped to this page. */
const hanken = Hanken_Grotesk({ variable: "--font-unk", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "UNKNOWN — Homepage Preview",
  description: "UNKNOWN, Lagos premium streetwear: homepage preview.",
  robots: { index: false, follow: false },
};

export default function UnknownPage() {
  return (
    <div className={`unk-page ${hanken.variable}`}>
      <UnknownShowroom />
      <PantsSection />
      <NewArrivals />
      <Caps />
      <Lookbook />
      <Visit />
      <Footer />
      <RevealInit />
    </div>
  );
}
