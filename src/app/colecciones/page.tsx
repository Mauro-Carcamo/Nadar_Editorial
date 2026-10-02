import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { collections } from "@/data/site";

export default function ColeccionesPage() {
  return (
    <>
      <SiteHeader />
      <main className="section section-light-alt">
        <div className="container page-intro">
          <p className="eyebrow">Colecciones</p>
          <h1>Rutas de lectura</h1>
          <p>Cada coleccion organiza problemas y conversaciones desde perspectivas situadas.</p>
        </div>

        <div className="container collections-grid">
          {collections.map((collection) => (
            <article key={collection.slug}>
              <h3>{collection.name}</h3>
              <p>{collection.description}</p>
              <Link className="text-link" href="/libros">
                Ver titulos
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
