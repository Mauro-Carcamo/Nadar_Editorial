import Image from "next/image";
import Link from "next/link";
import { Book, getCover } from "@/data/site";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

const formatPrice = (price: number) => `$${new Intl.NumberFormat("es-CL").format(price)}`;

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="book-grid">
      {books.map((book) => {
        const cover = getCover(book);
        return (
          <article key={book.slug} className="book-card">
            <Link href={`/libros/${book.slug}`} className="book-cover-wrap-link">
              <div className={`book-cover-wrap${cover.flat ? " is-flat" : ""}`}>
                <Image
                  src={cover.src}
                  alt={`Portada de ${book.title}`}
                  width={cover.width}
                  height={cover.height}
                  sizes="(min-width: 960px) 300px, (min-width: 640px) 45vw, 90vw"
                  className="book-cover"
                />
              </div>
            </Link>
            <div className="book-meta">
              {book.collection ? (
                <p className="book-collection">
                  {book.collection}
                  {book.series ? ` · ${book.series}` : ""}
                </p>
              ) : null}
              <h3>
                <Link href={`/libros/${book.slug}`}>{book.title}</Link>
              </h3>
              <p>{book.subtitle}</p>
              {book.bajada ? <p className="book-bajada">{book.bajada}</p> : null}
              <div className="book-card-actions">
                {book.price ? (
                  <>
                    <span className="book-mini-fact">{formatPrice(book.price)}</span>
                    <AddToCartButton
                      slug={book.slug}
                      title={book.title}
                      subtitle={book.subtitle}
                      image={cover.src}
                      price={book.price}
                      currency={book.currency ?? "CLP"}
                      className="pill"
                    />
                  </>
                ) : (
                  <Link href="/contacto" className="pill">
                    Consultar disponibilidad
                  </Link>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
