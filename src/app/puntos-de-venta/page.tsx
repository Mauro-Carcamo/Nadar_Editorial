import type { Metadata } from "next";
import { PointsOfSaleSection } from "@/components/points-of-sale/PointsOfSaleSection";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Puntos de venta | Nadar Ediciones",
  description: "Librerías de Chile donde encontrar los libros de Nadar Ediciones, con mapa por región.",
};

export default function PuntosDeVentaPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PointsOfSaleSection standalone />
      </main>
      <SiteFooter />
    </>
  );
}
