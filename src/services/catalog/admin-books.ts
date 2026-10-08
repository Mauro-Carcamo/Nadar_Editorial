import type { PoolClient } from "pg";
import { query, transaction } from "@/lib/db";
import type { BookFormData } from "@/schemas/book";
import { ACTIVE_DISCOUNT_JOIN } from "@/services/catalog/repository";

// Administración del catálogo (solo servidor). Pipeline: validación (Zod, en la acción) → transacción
// (libro, relaciones, portada, inventario) → auditoría. Las acciones revalidan el storefront.

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 120);

export type AdminBookRow = {
  id: string;
  slug: string;
  title: string;
  isbn: string | null;
  status: string;
  price: number | null;
  collection: string | null;
  authors: string | null;
  cover: string | null;
  stock: number;
  reserved: number;
  available: number;
  updated_at: Date;
  discount_percent: number | null; // descuento vigente (campaña activa)
  campaign: string | null;
  full_count: number;
};

export async function listAdminBooks(params: {
  q?: string;
  status?: string;
  collectionId?: string;
  discounted?: boolean;
  page: number;
  pageSize: number;
}) {
  const q = params.q?.trim() ? `%${params.q.trim()}%` : null;
  const { rows } = await query<AdminBookRow>(
    `SELECT b.id, b.slug, b.title, b.isbn, b.status, b.price, c.name AS collection,
            (SELECT string_agg(a.name, ', ' ORDER BY ba.position) FROM book_authors ba JOIN authors a ON a.id = ba.author_id
              WHERE ba.book_id = b.id AND ba.role IN ('author', 'editor', 'coordinator')) AS authors,
            (SELECT url FROM book_images WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) AS cover,
            COALESCE(i.stock, 0) AS stock, COALESCE(i.reserved, 0) AS reserved, COALESCE(i.available, 0) AS available,
            b.updated_at, disc.percent AS discount_percent, disc.name AS campaign, count(*) OVER()::int AS full_count
     FROM books b
     LEFT JOIN collections c ON c.id = b.collection_id
     LEFT JOIN inventory i ON i.book_id = b.id
     ${ACTIVE_DISCOUNT_JOIN}
     WHERE ($1::text IS NULL OR b.title ILIKE $1 OR b.isbn ILIKE $1 OR EXISTS (
              SELECT 1 FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id AND a.name ILIKE $1))
       AND ($2::text IS NULL OR b.status = $2)
       AND ($3::uuid IS NULL OR b.collection_id = $3)
       AND (NOT $6::boolean OR disc.percent IS NOT NULL)
     ORDER BY b.updated_at DESC
     LIMIT $4 OFFSET $5`,
    [q, params.status || null, params.collectionId || null, params.pageSize, (params.page - 1) * params.pageSize, Boolean(params.discounted)],
  );
  return { rows, total: rows[0]?.full_count ?? 0 };
}

/** Datos del libro con la forma del formulario. */
export async function getAdminBook(id: string) {
  const { rows } = await query<{
    id: string;
    slug: string;
    title: string;
    isbn: string | null;
    status: string;
    price: number | null;
    collection_id: string | null;
    series: string | null;
    bajada: string | null;
    description: string | null;
    author_bio: string | null;
    publication_year: number | null;
    pages: number | null;
    size: string | null;
    subject: string | null;
    featured: boolean;
    sales_rank: number | null;
    stock: number | null;
    reserved: number | null;
    people: { name: string; role: string }[] | null;
    categories: string[] | null;
    cover: { url: string; width: number | null; height: number | null } | null;
    sold: number;
    updated_at: Date;
  }>(
    `SELECT b.*, i.stock, i.reserved,
            (SELECT json_agg(json_build_object('name', a.name, 'role', ba.role) ORDER BY ba.position)
               FROM book_authors ba JOIN authors a ON a.id = ba.author_id WHERE ba.book_id = b.id) AS people,
            (SELECT array_agg(c.name ORDER BY c.name) FROM book_categories bc JOIN categories c ON c.id = bc.category_id
              WHERE bc.book_id = b.id) AS categories,
            (SELECT json_build_object('url', url, 'width', width, 'height', height) FROM book_images
              WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) AS cover,
            (SELECT COALESCE(sum(oi.quantity), 0)::int FROM order_items oi WHERE oi.book_id = b.id) AS sold
     FROM books b LEFT JOIN inventory i ON i.book_id = b.id WHERE b.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listCollectionOptions() {
  return (await query<{ id: string; name: string; series: string[] }>("SELECT id, name, series FROM collections ORDER BY position, name")).rows;
}

export async function listNameOptions() {
  const [authors, categories] = await Promise.all([
    query<{ name: string }>("SELECT name FROM authors ORDER BY name"),
    query<{ name: string }>("SELECT name FROM categories ORDER BY name"),
  ]);
  return { authors: authors.rows.map((r) => r.name), categories: categories.rows.map((r) => r.name) };
}

async function upsertByName(client: PoolClient, table: "authors" | "categories", name: string) {
  const slug = slugify(name);
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO ${table} (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug RETURNING id`,
    [name, slug],
  );
  return rows[0].id;
}

export class BookConflictError extends Error {
  constructor(public field: "slug" | "isbn", message: string) {
    super(message);
  }
}

/** Crea (id = null) o actualiza un libro con sus relaciones. Devuelve el id y el slug. */
export async function saveBook(id: string | null, data: BookFormData, userId: string) {
  const slug = data.slug || slugify(data.title);
  try {
    return await transaction(async (client) => {
      const values = [
        slug, data.title, data.isbn || null, data.status, data.price, data.collectionId || null, data.series || null,
        data.bajada || null, data.description || null, data.authorBio || null, data.year, data.pages, data.size || null,
        data.subject || null, data.featured, data.salesRank,
      ];
      const before = id ? (await client.query("SELECT status, price, title FROM books WHERE id = $1 FOR UPDATE", [id])).rows[0] : null;
      if (id && !before) throw new Error("El libro no existe");

      const saved = id
        ? await client.query<{ id: string }>(
            `UPDATE books SET slug = $1, title = $2, isbn = $3, status = $4, price = $5, collection_id = $6, series = $7,
               bajada = $8, description = $9, author_bio = $10, publication_year = $11, pages = $12, size = $13,
               subject = $14, featured = $15, sales_rank = $16
             WHERE id = $17 RETURNING id`,
            [...values, id],
          )
        : await client.query<{ id: string }>(
            `INSERT INTO books (slug, title, isbn, status, price, collection_id, series, bajada, description, author_bio,
               publication_year, pages, size, subject, featured, sales_rank, publisher_id, format)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
               (SELECT id FROM publishers WHERE slug = 'nadar-ediciones'), 'Libro impreso en papel')
             RETURNING id`,
            values,
          );
      const bookId = saved.rows[0].id;

      // Relaciones: se reemplazan completas
      await client.query("DELETE FROM book_authors WHERE book_id = $1", [bookId]);
      for (const [position, person] of data.people.entries()) {
        const authorId = await upsertByName(client, "authors", person.name);
        await client.query(
          "INSERT INTO book_authors (book_id, author_id, role, position) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
          [bookId, authorId, person.role, position],
        );
      }
      await client.query("DELETE FROM book_categories WHERE book_id = $1", [bookId]);
      for (const name of new Set(data.categories)) {
        const categoryId = await upsertByName(client, "categories", name);
        await client.query("INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [
          bookId,
          categoryId,
        ]);
      }

      // Portada
      if (data.coverUrl) {
        const current = await client.query<{ url: string }>(
          "SELECT url FROM book_images WHERE book_id = $1 AND kind = 'cover' ORDER BY position LIMIT 1",
          [bookId],
        );
        if (current.rows[0]?.url !== data.coverUrl) {
          await client.query("DELETE FROM book_images WHERE book_id = $1 AND kind = 'cover'", [bookId]);
          await client.query("INSERT INTO book_images (book_id, kind, url, width, height) VALUES ($1, 'cover', $2, $3, $4)", [
            bookId,
            data.coverUrl,
            data.coverWidth,
            data.coverHeight,
          ]);
        }
      }

      // Inventario: el formulario fija el stock total; la diferencia queda como movimiento ADJUSTMENT
      await client.query("INSERT INTO inventory (book_id, stock) VALUES ($1, 0) ON CONFLICT (book_id) DO NOTHING", [bookId]);
      if (data.stock !== null) {
        const inv = await client.query<{ stock: number; reserved: number }>(
          "SELECT stock, reserved FROM inventory WHERE book_id = $1 FOR UPDATE",
          [bookId],
        );
        const delta = data.stock - inv.rows[0].stock;
        if (delta !== 0) {
          if (data.stock < inv.rows[0].reserved) {
            throw new Error(`El stock no puede ser menor que lo reservado en pagos en curso (${inv.rows[0].reserved})`);
          }
          await client.query("UPDATE inventory SET stock = $2 WHERE book_id = $1", [bookId, data.stock]);
          await client.query(
            "INSERT INTO inventory_movements (book_id, delta_stock, reason, user_id, note) VALUES ($1, $2, 'ADJUSTMENT', $3, $4)",
            [bookId, delta, userId, data.stockNote || "Ajuste desde el panel"],
          );
        }
      }

      await client.query(
        "INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, $2, 'BOOK', $3, $4)",
        [
          userId,
          id ? "UPDATED" : "CREATED",
          bookId,
          JSON.stringify({ title: data.title, slug, status: data.status, price: data.price, before: before ?? undefined }),
        ],
      );
      return { id: bookId, slug };
    });
  } catch (error) {
    const pgError = error as { code?: string; constraint?: string };
    if (pgError.code === "23505") {
      if (pgError.constraint?.includes("isbn")) throw new BookConflictError("isbn", "Ya existe un libro con ese ISBN");
      throw new BookConflictError("slug", "Ya existe un libro con esa dirección (slug)");
    }
    throw error;
  }
}

/**
 * Elimina un libro. Si ya tiene ventas o pedidos, no se borra (romperia el historial):
 * se archiva y deja de mostrarse en la tienda.
 */
export async function deleteBook(id: string, userId: string) {
  return transaction(async (client) => {
    const book = await client.query<{ title: string; slug: string }>("SELECT title, slug FROM books WHERE id = $1 FOR UPDATE", [id]);
    if (!book.rowCount) throw new Error("El libro no existe");
    const used = await client.query("SELECT 1 FROM order_items WHERE book_id = $1 LIMIT 1", [id]);
    if (used.rowCount) {
      await client.query("UPDATE books SET status = 'ARCHIVED' WHERE id = $1", [id]);
      await client.query("INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, 'ARCHIVED', 'BOOK', $2, $3)", [
        userId,
        id,
        JSON.stringify({ title: book.rows[0].title, reason: "Tiene pedidos asociados" }),
      ]);
      return { archived: true, slug: book.rows[0].slug };
    }
    await client.query("DELETE FROM books WHERE id = $1", [id]);
    await client.query("INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, 'DELETED', 'BOOK', $2, $3)", [
      userId,
      id,
      JSON.stringify({ title: book.rows[0].title, slug: book.rows[0].slug }),
    ]);
    return { archived: false, slug: book.rows[0].slug };
  });
}
