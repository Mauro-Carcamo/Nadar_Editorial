import { CatalogBackground } from "@/components/CatalogBackground";
import { CatalogBrowser } from "@/components/catalog/CatalogBrowser";
import { Reveal } from "@/components/motion/Reveal";
import { listPublishedBooks } from "@/services/catalog/repository";

export async function CatalogSection() {
  const allBooks = await listPublishedBooks();
  if (!allBooks.length) return null;

  return (
    <section id="catalogo" className="home-catalog" aria-labelledby="home-catalog-title">
      <CatalogBackground />
      <div className="container">
        <Reveal>
          <header className="home-catalog-head">
            <div>
              <p className="home-hero-eyebrow">Catálogo</p>
              <h2 id="home-catalog-title" className="home-collections-heading">
                Todos los libros
              </h2>
            </div>
          </header>
        </Reveal>

        <CatalogBrowser books={allBooks} />
      </div>
    </section>
  );
}
