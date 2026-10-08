import type { PoolClient } from "pg";
import { query } from "@/lib/db";
import { ACTIVE_DISCOUNT_JOIN } from "@/services/catalog/repository";

export type SellableBook = {
  id: string;
  slug: string;
  title: string;
  isbn: string | null;
  price: number | null; // precio final (con descuento vigente)
  list_price: number | null;
  discount_percent: number | null;
  campaign: string | null;
  status: string;
  available: number;
};

// price = precio final (con el descuento vigente de su campaña, si hay); list_price = precio de lista
const SQL = `SELECT b.id, b.slug, b.title, b.isbn, b.status, COALESCE(i.available, 0) AS available,
                    b.price AS list_price, disc.percent AS discount_percent, disc.name AS campaign,
                    CASE WHEN b.price IS NULL OR disc.percent IS NULL THEN b.price
                         ELSE round(b.price * (100 - disc.percent) / 100.0)::int END AS price
             FROM books b LEFT JOIN inventory i ON i.book_id = b.id
             ${ACTIVE_DISCOUNT_JOIN}
             WHERE b.slug = ANY($1::text[])`;

/** Precio y disponibilidad reales desde la base (nunca desde el navegador). */
export async function getSellableBooks(slugs: string[], client?: PoolClient): Promise<Map<string, SellableBook>> {
  const result = client ? await client.query<SellableBook>(SQL, [slugs]) : await query<SellableBook>(SQL, [slugs]);
  return new Map(result.rows.map((row) => [row.slug, row]));
}

export type LineProblem = { slug: string; reason: "NOT_FOUND" | "NOT_FOR_SALE" | "NO_PRICE" | "NO_STOCK"; available?: number };

/** Valida que cada línea sea vendible con la cantidad pedida. */
export function validateLines(lines: { slug: string; quantity: number }[], books: Map<string, SellableBook>) {
  const problems: LineProblem[] = [];
  for (const line of lines) {
    const book = books.get(line.slug);
    if (!book) problems.push({ slug: line.slug, reason: "NOT_FOUND" });
    else if (book.status !== "PUBLISHED") problems.push({ slug: line.slug, reason: "NOT_FOR_SALE" });
    else if (book.price === null) problems.push({ slug: line.slug, reason: "NO_PRICE" });
    else if (book.available < line.quantity) problems.push({ slug: line.slug, reason: "NO_STOCK", available: book.available });
  }
  return problems;
}
