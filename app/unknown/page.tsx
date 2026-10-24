import type { Metadata } from "next";
import UnknownShowroom from "@/components/unknown/UnknownShowroom";
import "./unknown.css";

export const metadata: Metadata = {
  title: "UNKNOWN — Rack Preview",
  description: "An interactive preview of eleven UNKNOWN tops.",
  robots: { index: false, follow: false },
};

export default function UnknownPage() {
  return <UnknownShowroom />;
}
