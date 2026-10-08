import Link from "next/link";
import { dateTime, money } from "@/components/admin/format";
import { discountedPrice } from "@/data/book-utils";
import { listAdminBooks, listCollectionOptions } from "@/services/catalog/admin-books";

export const dynamic = "force-dynamic";
const PAGE = 25;

const STATUS_LABEL: Record<string, string> = { PUBLISHED: "Publicado", DRAFT: "Borrador", ARCHIVED: "Archivado" };
const STATUS_TONE: Record<string, string> = { PUBLISHED: "is-ok", DRAFT: "is-wait", ARCHIVED: "is-bad" };

type Search = { q?: string; estado?: string; coleccion?: string; descuento?: string; p?: string };

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.p) || 1);
  const status = params.estado && params.estado in STATUS_LABEL ? params.estado : undefined;
  const collections = await listCollectionOptions();
  const collectionId = collections.some((c) => c.id === params.coleccion) ? params.coleccion : undefined;
  const discounted = params.descuento === "1";
  const { rows, total } = await listAdminBooks({ q: params.q, status, collectionId, discounted, page, pageSize: PAGE });

  const href = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged = { q: params.q, estado: status, coleccion: collectionId, descuento: discounted ? "1" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/admin/libros?${s}` : "/admin/libros";
  };

  return (
    <>
      <header className="admin-head admin-head-row">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h2>Libros</h2>
          <p className="admin-sub">{total} {total === 1 ? "libro" : "libros"}. Solo los publicados se muestran en la tienda.</p>
        </div>
        <Link className="btn btn-primary" href="/admin/libros/nuevo">
          Nuevo libro
        </Link>
      </header>

      <form className="admin-search" action="/admin/libros">
        <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Título, ISBN o autor" aria-label="Buscar" />
        <select name="coleccion" defaultValue={collectionId ?? ""} aria-label="Colección">
          <option value="">Todas las colecciones</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {status ? <input type="hidden" name="estado" value={status} /> : null}
        {discounted ? <input type="hidden" name="descuento" value="1" /> : null}
        <button className="btn btn-outline" type="submit">
          Buscar
        </button>
      </form>

      <nav className="admin-filters" aria-label="Filtrar por estado">
        <Link href={href({ estado: undefined, p: undefined })} className={!status ? "is-active" : ""}>
          Todos
        </Link>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <Link key={k} href={href({ estado: k, p: undefined })} className={status === k ? "is-active" : ""}>
            {v}
          </Link>
        ))}
        <Link
          href={href({ descuento: discounted ? undefined : "1", p: undefined })}
          className={`admin-filter-discount${discounted ? " is-active" : ""}`}
        >
          Con descuento
        </Link>
      </nav>

      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table admin-books-table">
            <thead>
              <tr>
                <th aria-label="Portada" />
                <th>Libro</th>
                <th>Colección</th>
                <th>Precio</th>
                <th>Disponible</th>
                <th>Estado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    {b.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="admin-cover-thumb" src={b.cover} alt="" loading="lazy" />
                    ) : (
                      <span className="admin-cover-thumb is-empty" />
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/libros/${b.id}`}>
                      <strong>{b.title}</strong>
                    </Link>
                    <small className="admin-cell-sub">{b.authors ?? "Sin autores"}</small>
                    {b.isbn ? <small className="admin-cell-sub admin-mono">{b.isbn}</small> : null}
                  </td>
                  <td>{b.collection ?? "—"}</td>
                  <td>
                  {b.price === null ? (
                    "Sin precio"
                  ) : b.discount_percent ? (
                    <>
                      <s className="admin-strike">{money(b.price)}</s> <strong>{money(discountedPrice(b.price, b.discount_percent))}</strong>
                      <small className="admin-cell-sub admin-discount-tag">
                        −{b.discount_percent}% · {b.campaign}
                      </small>
                    </>
                  ) : (
                    money(b.price)
                  )}
                </td>
                  <td>
                    <strong className={b.available <= 3 ? "admin-low" : ""}>{b.available}</strong>
                    {b.reserved ? <small className="admin-cell-sub">{b.reserved} reservados</small> : null}
                  </td>
                  <td>
                    <span className={`admin-badge ${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                  </td>
                  <td>{dateTime(b.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No hay libros con esos filtros.</p>
      )}

      {total > PAGE ? (
        <nav className="admin-pager" aria-label="Páginas">
          {page > 1 ? <Link href={href({ p: String(page - 1) })}>← Anterior</Link> : <span />}
          <span>
            Página {page} de {Math.ceil(total / PAGE)}
          </span>
          {page * PAGE < total ? <Link href={href({ p: String(page + 1) })}>Siguiente →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
