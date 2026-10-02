import Link from "next/link";
import { notFound } from "next/navigation";
import { BookForm } from "@/components/admin/BookForm";
import { dateTime } from "@/components/admin/format";
import { query } from "@/lib/db";
import { PERSON_ROLES } from "@/schemas/book";
import { getAdminBook, listCollectionOptions, listNameOptions } from "@/services/catalog/admin-books";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: number | string | null | undefined) => (v === null || v === undefined ? "" : String(v));

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [book, collections, names] = await Promise.all([getAdminBook(id), listCollectionOptions(), listNameOptions()]);
  if (!book) notFound();

  const { rows: history } = await query<{ action: string; created_at: Date; who: string | null }>(
    `SELECT a.action, a.created_at, u.email AS who FROM audit_log a LEFT JOIN app_users u ON u.id = a.user_id
     WHERE a.entity = 'BOOK' AND a.entity_id = $1 ORDER BY a.created_at DESC LIMIT 8`,
    [id],
  );

  return (
    <>
      <header className="admin-head admin-head-row">
        <div>
          <p className="eyebrow">
            <Link href="/admin/libros">Libros</Link>
          </p>
          <h2>{book.title}</h2>
          <p className="admin-sub">
            {book.sold ? `${book.sold} vendidos o en pedidos · ` : ""}
            {book.reserved ? `${book.reserved} reservados en pagos en curso · ` : ""}
            Actualizado {dateTime(book.updated_at)}
          </p>
        </div>
        {book.status === "PUBLISHED" ? (
          <Link className="btn btn-outline" href={`/libros/${book.slug}`} target="_blank">
            Ver en la tienda
          </Link>
        ) : null}
      </header>

      <BookForm
        id={book.id}
        collections={collections}
        authorOptions={names.authors}
        categoryOptions={names.categories}
        hasOrders={book.sold > 0}
        defaultValues={{
          title: book.title,
          slug: book.slug,
          isbn: book.isbn ?? "",
          status: book.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
          price: str(book.price),
          collectionId: book.collection_id ?? "",
          series: book.series ?? "",
          people: (book.people ?? []).filter((p): p is { name: string; role: (typeof PERSON_ROLES)[number] } =>
            (PERSON_ROLES as readonly string[]).includes(p.role),
          ),
          categories: book.categories ?? [],
          bajada: book.bajada ?? "",
          description: book.description ?? "",
          authorBio: book.author_bio ?? "",
          year: str(book.publication_year),
          pages: str(book.pages),
          size: book.size ?? "",
          subject: book.subject ?? "",
          featured: book.featured,
          salesRank: str(book.sales_rank),
          stock: str(book.stock ?? 0),
          stockNote: "",
          coverUrl: book.cover?.url ?? "",
          coverWidth: str(book.cover?.width),
          coverHeight: str(book.cover?.height),
        }}
      />

      {history.length ? (
        <section className="admin-panel admin-book-history">
          <h3>Historial</h3>
          <ol className="admin-timeline">
            {history.map((h, i) => (
              <li key={i}>
                {h.action} · {dateTime(h.created_at)} · {h.who ?? "sistema"}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </>
  );
}
