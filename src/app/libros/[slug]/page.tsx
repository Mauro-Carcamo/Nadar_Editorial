import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { BookPrice } from "@/components/discounts/BookPrice";
import { DiscountBadge } from "@/components/discounts/DiscountBadge";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { finalPrice, getCover, getLeadAndBody } from "@/data/book-utils";
import { getBooksByCollection, getPublishedBook, listCollections, listPublishedBooks } from "@/services/catalog/repository";

// Se regenera cada 5 min: las campañas de descuento empiezan y terminan a su hora sin publicar de nuevo
export const revalidate = 300;

export async function generateStaticParams() {
  return (await listPublishedBooks()).map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) return {};
  return {
    title: `${book.title} · ${book.subtitle} | Nadar Ediciones`,
    description: book.bajada || undefined,
  };
}


export default async function BookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getPublishedBook(slug);

  if (!book) {
    notFound();
  }

  const cover = getCover(book);
  const collection = (await listCollections()).find((c) => c.name === book.collection);
  const { lead, body } = getLeadAndBody(book);
  const paragraphs = body.split("\n\n").filter(Boolean);
  const bio = (book.authorBio ?? "").split("\n\n").filter(Boolean);
  const related = book.collection
    ? (await getBooksByCollection(book.collection)).filter((b) => b.slug !== book.slug).slice(0, 4)
    : [];

  const facts: [string, string][] = [];
  if (book.isbn) facts.push(["ISBN", book.isbn]);
  if (book.year) facts.push(["Año", book.year]);
  if (book.pages) facts.push(["Páginas", String(book.pages)]);
  if (book.size) facts.push(["Tamaño", book.size]);
  if (book.subject) facts.push(["Materia", book.subject]);
  if (book.contributors?.length) facts.push(["Colaboran", book.contributors.join(" · ")]);

  return (
    <>
      <SiteHeader />
      <main className="book-page">
        <div className="container book-page-grid">
          <div className={`book-page-cover${cover.flat ? " is-flat" : ""}`}>
            <Image
              src={cover.src}
              alt={`Portada de ${book.title}, de ${book.subtitle}`}
              width={cover.width}
              height={cover.height}
              sizes="(min-width: 960px) 440px, 80vw"
              priority
            />
            <DiscountBadge discount={book.discount} />
          </div>

          <article className="book-page-content">
            {book.collection ? (
              <p className="home-hero-eyebrow">
                {collection ? <Link href={`/colecciones#${collection.slug}`}>{book.collection}</Link> : book.collection}
                {book.series ? ` · ${book.series}` : ""}
              </p>
            ) : null}
            <h1 className="book-page-title">{book.title}</h1>
            <p className="book-page-author">{book.subtitle}</p>

            {lead ? <p className="book-page-bajada">{lead}</p> : null}

            <div className="book-page-buy">
              {book.price ? (
                <>
                  <p className={`book-page-price${book.discount ? " has-discount" : ""}`}>
                    <BookPrice book={book} currency />
                  </p>
                  {book.discount ? (
                    <p className="book-page-discount-note">
                      {book.discount.percent}% de descuento · {book.discount.campaign}
                    </p>
                  ) : null}
                  <AddToCartButton
                    slug={book.slug}
                    title={book.title}
                    subtitle={book.subtitle}
                    image={cover.src}
                    price={finalPrice(book)}
                    listPrice={book.price ?? null}
                    campaign={book.discount?.campaign ?? null}
                    currency={book.currency ?? "CLP"}
                    className="btn btn-primary"
                  />
                </>
              ) : (
                <Link className="btn btn-primary" href="/contacto">
                  Consultar disponibilidad
                </Link>
              )}
              <Link className="btn btn-outline" href="/libros">
                Volver al catálogo
              </Link>
            </div>

            {paragraphs.length ? (
              <section className="book-page-section" aria-label="Sinopsis">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ) : null}

            {bio.length ? (
              <section className="book-page-section">
                <h2>Sobre {book.subtitle.includes(" y ") || book.subtitle.includes(",") ? "los autores" : "el autor"}</h2>
                {bio.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </section>
            ) : null}

            {facts.length ? (
              <section className="book-page-section">
                <h2>Ficha técnica</h2>
                <dl className="book-page-facts">
                  {facts.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {book.tags?.length ? (
              <ul className="book-page-tags" aria-label="Temas">
                {book.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            ) : null}
          </article>
        </div>

        {related.length ? (
          <section className="container book-page-related" aria-labelledby="related-title">
            <h2 id="related-title">Más de {book.collection}</h2>
            <ul>
              {related.map((r) => {
                const rc = getCover(r);
                return (
                  <li key={r.slug}>
                    <Link href={`/libros/${r.slug}`}>
                      <span className={`book-page-related-cover${rc.flat ? " is-flat" : ""}`}>
                        <Image src={rc.src} alt="" width={rc.width} height={rc.height} sizes="200px" />
                      </span>
                      <span className="book-page-related-title">{r.title}</span>
                      <span className="book-page-related-author">{r.subtitle}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
