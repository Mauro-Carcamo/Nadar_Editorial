import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { allBooks, getBookBySlug, hasRealDescription } from "@/data/site";

export function generateStaticParams() {
  return allBooks.map((book) => ({ slug: book.slug }));
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="section section-light">
        <div className="container book-detail-grid">
          <div className="book-detail-image-wrap">
            <Image
              src={book.image}
              alt={`Portada de ${book.title}`}
              width={900}
              height={1200}
              className="book-detail-image"
              priority
            />
          </div>
          <article className="book-detail-content">
            <p className="eyebrow">{book.collection}</p>
            <h1>{book.title}</h1>
            <p className="book-detail-author">{book.subtitle}</p>
            <div className="book-detail-facts">
              {book.isbn ? <p><strong>ISBN:</strong> {book.isbn}</p> : null}
              {book.publishDate ? <p><strong>Fecha:</strong> {book.publishDate}</p> : null}
              {book.subject ? <p><strong>Materia:</strong> {book.subject}</p> : null}
              {book.publicationType ? <p><strong>Formato:</strong> {book.publicationType}</p> : null}
              {book.price ? (
                <p>
                  <strong>Precio:</strong> {new Intl.NumberFormat("es-CL").format(book.price)}{" "}
                  {book.currency ?? "CLP"}
                </p>
              ) : null}
            </div>
            <p className="book-detail-bajada">{book.bajada}</p>
            {hasRealDescription(book) ? <p>{book.description}</p> : null}
            <div className="hero-actions">
              <AddToCartButton
                slug={book.slug}
                title={book.title}
                subtitle={book.subtitle}
                image={book.image}
                price={book.price ?? null}
                currency={book.currency ?? "CLP"}
                className="btn btn-primary"
              />
              <a className="btn btn-outline" href="mailto:contacto@nadarediciones.cl">
                Consultar disponibilidad
              </a>
              <Link className="btn btn-outline" href="/libros">
                Volver al catalogo
              </Link>
            </div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
