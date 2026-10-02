import { CollectionsExplorer } from "@/components/CollectionsExplorer";
import { Reveal } from "@/components/motion/Reveal";
import { allBooks, collections } from "@/data/site";

export function CollectionsSection() {
  const withBooks = collections
    .map((collection) => ({
      ...collection,
      books: allBooks.filter((book) => book.collection === collection.name),
    }))
    .filter((collection) => collection.books.length);

  if (!withBooks.length) return null;

  return (
    <section className="home-collections" aria-labelledby="home-collections-title">
      <div className="container">
        <Reveal>
          <header className="home-collections-head">
            <p className="home-hero-eyebrow">Colecciones</p>
            <h2 id="home-collections-title" className="home-collections-heading">
              Rutas de lectura
            </h2>
            <p className="home-collections-intro">
              Cada colección organiza problemas y conversaciones desde perspectivas situadas.
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
