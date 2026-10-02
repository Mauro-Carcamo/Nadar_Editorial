import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

// Títulos: serif editorial (eje óptico); interfaz y lectura: sans neutra
const displayFont = Newsreader({
  variable: "--font-display",
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
      <body className={`${displayFont.variable} ${uiFont.variable}`}>
        <CartProvider>{children}</CartProvider>
        <AnalyticsTracker />
      </body>
    </html>
  );
}
