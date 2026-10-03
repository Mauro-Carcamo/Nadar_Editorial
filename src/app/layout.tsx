import type { Metadata } from "next";
import { Inter, Josefin_Sans, Newsreader } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

// Títulos y menús: Josefin Sans, la tipografía del sitio original (tema Blogus).
// Citas y bajadas: serif editorial en cursiva. Interfaz y lectura: sans neutra.
const displayFont = Josefin_Sans({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
});

const serifFont = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const uiFont = Inter({
  variable: "--font-ui",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Nadar Ediciones | Libros de arte y crítica",
  description: "Editorial independiente con catálogo de arte, pensamiento y crítica.",
  openGraph: { siteName: "Nadar Ediciones", locale: "es_CL", type: "website" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${displayFont.variable} ${serifFont.variable} ${uiFont.variable}`}>
        <CartProvider>{children}</CartProvider>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
