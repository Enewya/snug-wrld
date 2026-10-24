import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import UnknownShowroom from "@/components/unknown/UnknownShowroom";
import PantsSection from "@/components/unknown/pants-section/PantsSection";
import "@/components/unknown/tokens.css";
import "./unknown.css";

/* UNKNOWN type: Hanken Grotesk (Google Fonts, free), closest free match to the reference's
   neo-grotesque; see components/unknown/pants-section/HANDOFF.md. Scoped to this page. */
const hanken = Hanken_Grotesk({ variable: "--font-unk", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "UNKNOWN — Rack Preview",
  description: "An interactive preview of eleven UNKNOWN tops.",
  robots: { index: false, follow: false },
};

export default function UnknownPage() {
  return (
    <div className={`unk-page ${hanken.variable}`}>
      <UnknownShowroom />
      <PantsSection />
    </div>
  );
}
