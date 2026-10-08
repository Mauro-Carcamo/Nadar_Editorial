import Link from "next/link";
import { query } from "@/lib/db";
import { saveCollection } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCollectionsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const { rows } = await query<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    intro: string | null;
    series: string[];
    position: number;
    books: number;
    published: number;
  }>(
    `SELECT c.id, c.name, c.slug, c.description, c.intro, c.series, c.position,
            count(b.id)::int AS books, count(b.id) FILTER (WHERE b.status = 'PUBLISHED')::int AS published
     FROM collections c LEFT JOIN books b ON b.collection_id = c.id
     GROUP BY c.id ORDER BY c.position, c.name`,
  );

  return (
    <>
      <header className="admin-head admin-head-row">
        <div>
          <p className="eyebrow">
            <Link href="/admin/web">Editar web</Link>
          </p>
          <h2>Colecciones</h2>
          <p className="admin-sub">
            Se muestran en «Rutas de lectura» del inicio, en el orden indicado. La descripción aparece sobre la tira de
            portadas de cada colección. Para cambiar qué libros tiene una colección, edita el libro.
          </p>
        </div>
        <Link className="btn btn-outline" href="/#colecciones" target="_blank">
          Ver en el sitio
        </Link>
      </header>
      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}

      <div className="admin-collections">
        {rows.map((c) => (
          <details key={c.id} id={`c-${c.id}`} className="admin-panel admin-collection" open={ok === c.id}>
            <summary>
              <span className="admin-collection-order">{String(c.position).padStart(2, "0")}</span>
              <strong>{c.name}</strong>
              <small>
                {c.published} publicados{c.books > c.published ? ` · ${c.books - c.published} sin publicar` : ""}
              </small>
              {ok === c.id ? <span className="admin-ok">Guardado</span> : null}
            </summary>
            <form action={saveCollection} className="admin-form admin-discount-form">
              <input type="hidden" name="id" value={c.id} />
              <label>
                Nombre
                <input name="name" defaultValue={c.name} required maxLength={80} />
              </label>
              <label>
                Orden en el inicio
                <input type="number" name="position" defaultValue={c.position} min={0} max={999} />
                <small>Menor número = aparece antes.</small>
              </label>
              <label className="is-wide">
                Descripción (se ve sobre la tira de portadas)
                <textarea name="description" defaultValue={c.description ?? ""} rows={3} maxLength={600} />
              </label>
              <label className="is-wide">
                Presentación larga (página de colecciones)
                <textarea name="intro" defaultValue={c.intro ?? ""} rows={4} maxLength={2000} />
              </label>
              <label className="is-wide">
                Series (separadas por coma)
                <input name="series" defaultValue={c.series.join(", ")} />
                <small>Se ofrecen como opciones al editar un libro de esta colección.</small>
              </label>
              <div className="admin-form-actions is-wide">
                <button className="btn btn-primary">Guardar colección</button>
                <Link className="btn btn-outline" href={`/admin/libros?coleccion=${c.id}`}>
                  Ver sus libros
                </Link>
              </div>
            </form>
          </details>
        ))}
      </div>
    </>
  );
}
