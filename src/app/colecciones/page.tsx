import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getCover } from "@/data/book-utils";
import { listCollections, listPublishedBooks } from "@/services/catalog/repository";

export const metadata: Metadata = {
  title: "Colecciones | Nadar Ediciones",
  description: "Nadar Ediciones organiza su catálogo en torno a seis colecciones.",
};

export default async function ColeccionesPage() {
  const [collections, allBooks] = await Promise.all([listCollections(), listPublishedBooks()]);
  return (
    <>
      <SiteHeader />
      <main className="collections-page">
        <div className="container">
          <header className="collections-page-head">
            <p className="home-hero-eyebrow">Colecciones</p>
            <h1 className="home-collections-heading">Rutas de lectura</h1>
            <p className="home-collections-intro">
              Nadar Ediciones organiza su catálogo en torno a seis colecciones.
            </p>
          </header>

          {collections.map((collection, index) => {
            const books = allBooks.filter((b) => b.collection === collection.name);
            return (
              <section key={collection.slug} id={collection.slug} className="collections-page-item">
                <div className="collections-page-text">
                  <span className="collections-page-index">{String(index + 1).padStart(2, "0")}</span>
                  <h2>{collection.name}</h2>
                  <p className="collections-page-lead">{collection.description}</p>
                  {collection.intro ? <p>{collection.intro}</p> : null}
                  {collection.series.length ? (
                    <p className="collections-page-series">Series: {collection.series.join(" · ")}</p>
                  ) : null}
                  <p className="collections-page-count">
                    {books.length} {books.length === 1 ? "título" : "títulos"}
                  </p>
                </div>

                {books.length ? (
                  <ul className="collections-page-books">
                    {books.map((book) => {
                      const cover = getCover(book);
                      return (
                        <li key={book.slug}>
                          <Link href={`/libros/${book.slug}`} title={`${book.title} · ${book.subtitle}`}>
                            <span className={`collections-page-cover${cover.flat ? " is-flat" : ""}`}>
                              <Image
                                src={cover.src}
                                alt={`Portada de ${book.title}`}
                                width={cover.width}
                                height={cover.height}
                                sizes="160px"
                              />
                            </span>
                            <span className="collections-page-book-title">{book.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </section>
            );
          })}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
