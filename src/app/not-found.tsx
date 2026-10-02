import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Página no encontrada | Nadar Ediciones" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="not-found">
        <div className="container">
          <p className="home-hero-eyebrow">Error 404</p>
          <h1 className="home-collections-heading">Esta página se fue nadando</h1>
          <p>La dirección no existe o el libro ya no está disponible.</p>
          <div className="about-cta">
            <Link className="btn btn-primary" href="/libros">
              Ir al catálogo
            </Link>
            <Link className="btn btn-outline" href="/">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
