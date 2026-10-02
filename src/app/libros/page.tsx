import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CatalogClient } from "@/components/CatalogClient";
import { allBooks } from "@/data/site";

export default function LibrosPage() {
  return (
    <>
      <SiteHeader />
      <main className="section section-light">
        <div className="container page-intro">
          <p className="eyebrow">Catalogo</p>
          <h1>Explora libros</h1>
          <p>Busqueda y filtros locales con datos enriquecidos desde web + Excel.</p>
        </div>

        <CatalogClient books={allBooks} />
      </main>
      <SiteFooter />
    </>
  );
}

