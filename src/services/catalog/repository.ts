import { cache } from "react";
import type { Book, Collection } from "@/data/book-utils";
import { joinNames } from "@/data/book-utils";
import { isDatabaseConfigured, query } from "@/lib/db";

// Catálogo para el storefront (solo servidor). Fuente: PostgreSQL.
// Si no hay base configurada se usa el JSON del repositorio (misma forma de datos).

const ROLE_LABEL: Record<string, string> = {
  translator: "traductor",
  prologue: "prólogo",
  illustrator: "ilustración",
};

type BookRow = {
  slug: string;
  title: string;
  isbn: string | null;
  bajada: string | null;
  description: string | null;
  author_bio: string | null;
  price: number | null;
  currency: string;
  series: string | null;
  publication_year: number | null;
  pages: number | null;
  size: string | null;
  subject: string | null;
  format: string | null;
  sales_rank: number | null;
  source_url: string | null;
  collection: string | null;
  available: number | null;
  people: { name: string; role: string }[] | null;
  tags: string[] | null;
  cover: string | null;
  cover_width: number | null;
  cover_height: number | null;
  mockup: string | null;
};

const BOOK_SELECT = `
  SELECT b.slug, b.title, b.isbn, b.bajada, b.description, b.author_bio, b.price, b.currency, b.series,
         b.publication_year, b.pages, b.size, b.subject, b.format, b.sales_rank, b.source_url,
         c.name AS collection, i.available,
         (SELECT json_agg(json_build_object('name', a.name, 'role', ba.role) ORDER BY ba.position)
            FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id) AS people,
         (SELECT array_agg(cat.name ORDER BY cat.name)
            FROM book_categories bc JOIN categories cat ON cat.id = bc.category_id WHERE bc.book_id = b.id) AS tags,
         cov.url AS cover, cov.width AS cover_width, cov.height AS cover_height,
         (SELECT url FROM book_images WHERE book_id = b.id AND kind = 'mockup' ORDER BY position LIMIT 1) AS mockup
  FROM books b
  LEFT JOIN collections c ON c.id = b.collection_id
  LEFT JOIN inventory i ON i.book_id = b.id
  LEFT JOIN LATERAL (SELECT url, width, height FROM book_images
                     WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) cov ON true`;

function toBook(r: BookRow): Book {
  const people = r.people ?? [];
  const main = people.filter((p) => ["author", "editor", "coordinator"].includes(p.role));
  const onlyEditors = main.length > 0 && main.every((p) => p.role === "editor");
  const onlyCoordinators = main.length > 0 && main.every((p) => p.role === "coordinator");
  const subtitle =
    joinNames(main.map((p) => p.name)) + (onlyEditors ? " (editores)" : onlyCoordinators ? " (coordinadores)" : "");
  return {
    slug: r.slug,
    title: r.title,
    subtitle: subtitle || "Nadar Ediciones",
    contributors: people.filter((p) => ROLE_LABEL[p.role]).map((p) => `${p.name} (${ROLE_LABEL[p.role]})`),
    image: r.mockup ?? r.cover ?? "",
    cover: r.cover,
    coverWidth: r.cover_width,
    coverHeight: r.cover_height,
    collection: r.collection ?? "",
    series: r.series,
    bajada: r.bajada ?? "",
    description: r.description ?? "",
    authorBio: r.author_bio ?? "",
    tags: r.tags ?? [],
    isbn: r.isbn,
    price: r.price,
    currency: r.currency,
    year: r.publication_year ? String(r.publication_year) : null,
    pages: r.pages,
    size: r.size,
    subject: r.subject,
    publicationType: r.format,
    sourceUrl: r.source_url ?? undefined,
    salesRank: r.sales_rank,
    available: r.available,
    dataSource: "postgres",
  };
}

// ---------------------------------------------------------------- respaldo JSON (sin base de datos)
async function loadJsonCatalog() {
  const [books, collections, covers] = await Promise.all([
    import("@/data/books.enriched.json"),
    import("@/data/collections.json"),
    import("@/data/covers.json"),
  ]);
  const sizes = covers.default as Record<string, number[]>;
  return {
    books: (books.default as Book[]).map((b) => {
      const size = sizes[(b.cover ?? "").split("/").pop() ?? ""];
      return { ...b, coverWidth: size?.[0] ?? null, coverHeight: size?.[1] ?? null };
    }),
    collections: collections.default as Collection[],
  };
}

// ---------------------------------------------------------------- API pública del repositorio

/** Libros publicados, del más reciente al más antiguo. */
export const listPublishedBooks = cache(async (): Promise<Book[]> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).books;
  const { rows } = await query<BookRow>(
    `${BOOK_SELECT} WHERE b.status = 'PUBLISHED' ORDER BY b.publication_year DESC NULLS LAST, b.title`,
  );
  return rows.map(toBook);
});

export const getPublishedBook = cache(async (slug: string): Promise<Book | undefined> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).books.find((b) => b.slug === slug);
  const { rows } = await query<BookRow>(`${BOOK_SELECT} WHERE b.status = 'PUBLISHED' AND b.slug = $1`, [slug]);
  return rows[0] ? toBook(rows[0]) : undefined;
});

export const listCollections = cache(async (): Promise<Collection[]> => {
  if (!isDatabaseConfigured()) return (await loadJsonCatalog()).collections;
  const { rows } = await query<{ slug: string; name: string; description: string | null; intro: string | null; series: string[]; source_url: string | null }>(
    "SELECT slug, name, description, intro, series, source_url FROM collections ORDER BY position, name",
  );
  return rows.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    intro: c.intro ?? "",
    series: c.series ?? [],
    sourceUrl: c.source_url ?? "",
  }));
});

export async function getBooksByCollection(name: string) {
  return (await listPublishedBooks()).filter((b) => b.collection === name);
}

/** Ranking manual de ventas (1 = más vendido); el resto en orden de catálogo. */
export async function getBestsellers(limit = 10) {
  const books = await listPublishedBooks();
  return books
    .map((book, index) => ({ book, index }))
    .sort((a, b) => (a.book.salesRank ?? Infinity) - (b.book.salesRank ?? Infinity) || a.index - b.index)
    .slice(0, limit)
    .map(({ book }) => book);
}
