import Link from "next/link";
import { query } from "@/lib/db";
import { HeroEditor } from "./HeroEditor";

export const dynamic = "force-dynamic";

export default async function AdminHeroPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const { rows } = await query<{ id: string; title: string; authors: string | null; cover: string | null; sales_rank: number | null }>(
    `SELECT b.id, b.title, b.sales_rank,
            (SELECT string_agg(a.name, ', ' ORDER BY ba.position) FROM book_authors ba JOIN authors a ON a.id = ba.author_id
              WHERE ba.book_id = b.id AND ba.role IN ('author', 'editor', 'coordinator')) AS authors,
            (SELECT url FROM book_images WHERE book_id = b.id AND kind = 'cover' ORDER BY position LIMIT 1) AS cover
     FROM books b WHERE b.status = 'PUBLISHED' ORDER BY b.title`,
  );
  const initial = rows
    .filter((b) => b.sales_rank !== null && b.sales_rank <= 10)
    .sort((a, b) => a.sales_rank! - b.sales_rank!)
    .map((b) => b.id);

  return (
    <>
      <header className="admin-head admin-head-row">
        <div>
          <p className="eyebrow">
            <Link href="/admin/web">Editar web</Link>
          </p>
          <h2>Destacados del inicio</h2>
          <p className="admin-sub">
            Los libros del carrusel «Top 10 Destacados», en el orden en que se muestran. Si eliges menos de 10, se
            completan con los más recientes del catálogo. Solo aparecen libros publicados.
          </p>
        </div>
        <Link className="btn btn-outline" href="/#inicio" target="_blank">
          Ver en el sitio
        </Link>
      </header>
      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}
      {ok ? <p className="admin-ok">Destacados guardados.</p> : null}
      <HeroEditor books={rows.map(({ id, title, authors, cover }) => ({ id, title, authors, cover }))} initial={initial} />
    </>
  );
}
