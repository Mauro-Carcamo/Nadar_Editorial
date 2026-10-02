import type { PoolClient } from "pg";
import { query } from "@/lib/db";

export type SellableBook = {
  id: string;
  slug: string;
  title: string;
  isbn: string | null;
  price: number | null;
  status: string;
  available: number;
};

const SQL = `SELECT b.id, b.slug, b.title, b.isbn, b.price, b.status, COALESCE(i.available, 0) AS available
             FROM books b LEFT JOIN inventory i ON i.book_id = b.id
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
