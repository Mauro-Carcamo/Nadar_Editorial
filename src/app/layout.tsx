import type { Metadata } from "next";
import { Josefin_Sans, Open_Sans, Rubik } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const displayFont = Josefin_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const uiFont = Open_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const accentFont = Rubik({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
      <body className={`${displayFont.variable} ${uiFont.variable} ${accentFont.variable}`}>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
