import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
  // Only used in the focus view, so don't preload it on the rack.
  preload: false,
});

export const metadata: Metadata = {
  title: "Snug Wrld",
  description: "It's us, never them.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html> before React hydrates
    // (the documented fix; it applies to this element's own attributes only, not its children)
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${archivoBlack.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
