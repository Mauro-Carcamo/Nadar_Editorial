import { CollectionsExplorer } from "@/components/CollectionsExplorer";
import { Reveal } from "@/components/motion/Reveal";
import { listCollections, listPublishedBooks } from "@/services/catalog/repository";

export async function CollectionsSection() {
  const [allBooks, collections] = await Promise.all([listPublishedBooks(), listCollections()]);
  const withBooks = collections
    .map((collection) => ({
      ...collection,
      books: allBooks.filter((book) => book.collection === collection.name),
    }))
    .filter((collection) => collection.books.length);

  if (!withBooks.length) return null;

  return (
    <section id="colecciones" className="home-collections" aria-labelledby="home-collections-title">
      {/* Ola de marca en el borde superior (la de la cabecera, girada hacia arriba), del color de fondo de la sección */}
      <div className="section-waves" aria-hidden="true">
        <svg viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
          <defs>
            <path id="collections-wave" d="M-160 44c30 0 58-12 88-12s58 12 88 12 58-12 88-12 58 12 88 12v44h-352z" />
          </defs>
          <g className="parallax">
            <use href="#collections-wave" x="48" y="0" className="section-wave-back" />
            <use href="#collections-wave" x="48" y="3" className="section-wave-mid" />
            <use href="#collections-wave" x="48" y="6" className="section-wave-front" />
          </g>
        </svg>
      </div>
      <div className="container">
        <Reveal>
          <header className="home-collections-head">
            <p className="home-hero-eyebrow">Colecciones</p>
            <h2 id="home-collections-title" className="home-collections-heading">
              Rutas de lectura
            </h2>
            <p className="home-collections-intro">
              Nadar Ediciones organiza su catálogo en torno a seis colecciones.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.12} y={40}>
          <CollectionsExplorer collections={withBooks} />
        </Reveal>
      </div>
    </section>
  );
}
