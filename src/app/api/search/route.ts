import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, query } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Búsqueda del catálogo (barra de filtros del home): libros por título/ISBN/autor y autores por nombre.
// Sin distinguir mayúsculas ni tildes. Solo libros publicados.

const Q = z.string().trim().min(4).max(80);

// Normaliza en SQL: minúsculas y sin tildes (sin depender de la extensión unaccent)
const norm = (expr: string) => `translate(lower(${expr}), 'áéíóúüñàèìòùâêîôûäëïöç', 'aeiouunaeiouaeiouaeioc')`;
const normText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export async function GET(request: NextRequest) {
  if (!rateLimit(`search:${clientIp(request)}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }
  const parsed = Q.safeParse(request.nextUrl.searchParams.get("q") ?? "");
  if (!parsed.success) return NextResponse.json({ books: [], authors: [] });
  if (!isDatabaseConfigured()) return NextResponse.json({ books: [], authors: [] });

  // Escapa comodines de LIKE antes de armar el patrón
  const pattern = `%${normText(parsed.data).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

  const [books, authors] = await Promise.all([
    query<{ slug: string; title: string; authors: string | null; cover: string | null }>(
      `SELECT b.slug, b.title,
              (SELECT string_agg(a.name, ', ' ORDER BY ba.position) FROM book_authors ba JOIN authors a ON a.id = ba.author_id
                WHERE ba.book_id = b.id AND ba.role IN ('author', 'editor', 'coordinator')) AS authors,
              (SELECT url FROM book_images WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) AS cover
       FROM books b
       WHERE b.status = 'PUBLISHED'
         AND (${norm("b.title")} LIKE $1 OR ${norm("coalesce(b.isbn, '')")} LIKE $1
              OR EXISTS (SELECT 1 FROM book_authors ba JOIN authors a ON a.id = ba.author_id
                         WHERE ba.book_id = b.id AND ${norm("a.name")} LIKE $1))
       ORDER BY (${norm("b.title")} LIKE $1) DESC, b.title
       LIMIT 6`,
      [pattern],
    ),
    query<{ name: string; slugs: string[] }>(
      `SELECT a.name, array_agg(DISTINCT b.slug) AS slugs
       FROM authors a
       JOIN book_authors ba ON ba.author_id = a.id
       JOIN books b ON b.id = ba.book_id AND b.status = 'PUBLISHED'
       WHERE ${norm("a.name")} LIKE $1
       GROUP BY a.name
       ORDER BY a.name
       LIMIT 6`,
      [pattern],
    ),
  ]);

  return NextResponse.json({ books: books.rows, authors: authors.rows });
}
