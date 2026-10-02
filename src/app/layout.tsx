import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
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
  title: "Nadar Ediciones | Libros de arte y crítica",
  description:
    "Editorial independiente con catálogo de arte, pensamiento y crítica.",
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
      </body>
    </html>
  );
}
