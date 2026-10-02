import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { listPointsOfSale } from "@/services/points-of-sale/repository";
import { PointsOfSaleExplorer } from "./PointsOfSaleExplorer";

export async function PointsOfSaleSection({ standalone = false }: { standalone?: boolean }) {
  const points = await listPointsOfSale();
  if (!points.length) return null;
  const regions = new Set(points.map((p) => p.region)).size;
  const Heading = standalone ? "h1" : "h2";

  return (
    <section className={`home-pos${standalone ? " is-page" : ""}`} aria-labelledby="pos-title">
      <div className="container">
        <Reveal>
          <header className="home-catalog-head">
            <div>
              <p className="home-hero-eyebrow">Puntos de venta</p>
              <Heading id="pos-title" className="home-collections-heading">
                Dónde encontrar nuestros libros
              </Heading>
              <p className="home-pos-intro">
                {points.length} librerías en {regions} regiones de Chile. Elige una región o una librería para verla en el mapa.
              </p>
            </div>
            {standalone ? null : (
              <Link href="/puntos-de-venta" className="btn btn-outline">
                Ver todos los puntos
              </Link>
            )}
          </header>
        </Reveal>
        <PointsOfSaleExplorer points={points} initialRegion={standalone ? undefined : "Metropolitana de Santiago"} />
      </div>
    </section>
  );
}
