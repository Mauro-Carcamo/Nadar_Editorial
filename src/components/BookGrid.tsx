import Image from "next/image";
import Link from "next/link";
import { Book } from "@/data/site";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function BookGrid({ books }: { books: Book[] }) {
  return (
    <div className="book-grid">
      {books.map((book) => (
        <article key={book.slug} className="book-card">
          <Link href={`/libros/${book.slug}`} className="book-cover-wrap-link">
            <div className="book-cover-wrap">
              <span className="book-badge">{book.collection}</span>
              <Image
                src={book.image}
                alt={`Portada de ${book.title}`}
                width={600}
                height={800}
                className="book-cover"
              />
            </div>
          </Link>
          <div className="book-meta">
            <p className="book-collection">{book.collection}</p>
            <h3>{book.title}</h3>
            <p>{book.subtitle}</p>
            {book.isbn ? <p className="book-mini-fact">ISBN: {book.isbn}</p> : null}
            {book.price ? (
              <p className="book-mini-fact">
                {new Intl.NumberFormat("es-CL").format(book.price)} {book.currency ?? "CLP"}
              </p>
            ) : null}
            <p className="book-bajada">{book.bajada}</p>
            <div className="book-card-actions">
              <Link href={`/libros/${book.slug}`} className="text-link">
                Ver detalle
              </Link>
              <AddToCartButton
                slug={book.slug}
                title={book.title}
                subtitle={book.subtitle}
                image={book.image}
                price={book.price ?? null}
                currency={book.currency ?? "CLP"}
                className="pill"
              />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
