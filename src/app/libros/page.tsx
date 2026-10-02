import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { CatalogClient } from "@/components/CatalogClient";
import { listCollections, listPublishedBooks } from "@/services/catalog/repository";

export default async function LibrosPage() {
  const [books, collections] = await Promise.all([listPublishedBooks(), listCollections()]);
  return (
    <>
      <SiteHeader />
      <main className="section section-light">
        <div className="container page-intro">
          <p className="eyebrow">Catálogo</p>
          <h1>Explora libros</h1>
          <p>Busca por título, autor, ISBN o tema, o explora por colección.</p>
        </div>

        <CatalogClient books={books} collectionOrder={collections.map((c) => c.name)} />
      </main>
      <SiteFooter />
    </>
  );
}

