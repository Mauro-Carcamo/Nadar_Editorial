import Link from "next/link";
import { removeBookDiscount, setBookDiscount } from "@/app/admin/(panel)/descuentos/actions";
import { money } from "@/components/admin/format";
import { discountedPrice } from "@/data/book-utils";
import { query } from "@/lib/db";

const STATE: Record<string, { label: string; tone: string }> = {
  VIGENTE: { label: "Vigente", tone: "is-ok" },
  PROGRAMADA: { label: "Programada", tone: "is-wait" },
  TERMINADA: { label: "Terminada", tone: "is-bad" },
  INACTIVA: { label: "Inactiva", tone: "is-bad" },
};

const CAMPAIGN_STATE = `CASE WHEN NOT dc.is_active THEN 'INACTIVA'
                            WHEN dc.starts_at > now() THEN 'PROGRAMADA'
                            WHEN dc.ends_at IS NOT NULL AND dc.ends_at <= now() THEN 'TERMINADA'
                            ELSE 'VIGENTE' END`;

/**
 * Descuentos del libro dentro de su ficha del panel: en qué campañas está, con qué porcentaje,
 * y agregarlo a otra campaña sin salir del libro. Usa las mismas acciones que /admin/descuentos.
 */
export async function BookDiscountsPanel({ bookId, price }: { bookId: string; price: number | null }) {
  const back = `/admin/libros/${bookId}`;
  const [memberships, campaigns] = await Promise.all([
    query<{ campaign_id: string; name: string; percent: number; state: string }>(
      `SELECT dc.id AS campaign_id, dc.name, bd.percent, ${CAMPAIGN_STATE} AS state
       FROM book_discounts bd JOIN discount_campaigns dc ON dc.id = bd.campaign_id
       WHERE bd.book_id = $1 ORDER BY dc.starts_at DESC`,
      [bookId],
    ),
    // Campañas a las que se puede agregar: no terminadas y donde el libro aún no está
    query<{ id: string; name: string; state: string }>(
      `SELECT dc.id, dc.name, ${CAMPAIGN_STATE} AS state FROM discount_campaigns dc
       WHERE (dc.ends_at IS NULL OR dc.ends_at > now())
         AND NOT EXISTS (SELECT 1 FROM book_discounts bd WHERE bd.campaign_id = dc.id AND bd.book_id = $1)
       ORDER BY dc.starts_at DESC`,
      [bookId],
    ),
  ]);

  return (
    <section className="admin-panel admin-book-discounts" aria-labelledby="book-discounts-title">
      <h3 id="book-discounts-title">Descuentos y campañas</h3>
      {price === null ? (
        <p className="admin-sub">Define un precio para poder aplicar descuentos a este libro.</p>
      ) : null}

      {memberships.rows.length ? (
        <ul className="admin-book-discount-list">
          {memberships.rows.map((m) => (
            <li key={m.campaign_id}>
              <div>
                <Link href={`/admin/descuentos/${m.campaign_id}`}>
                  <strong>{m.name}</strong>
                </Link>
                <span className={`admin-badge ${STATE[m.state].tone}`}>{STATE[m.state].label}</span>
                {price !== null ? (
                  <small className="admin-cell-sub">
                    <s>{money(price)}</s> → <strong>{money(discountedPrice(price, m.percent))}</strong>
                  </small>
                ) : null}
              </div>
              <form action={setBookDiscount} className="admin-inline-form">
                <input type="hidden" name="campaignId" value={m.campaign_id} />
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="back" value={back} />
                <input type="number" name="percent" min={1} max={90} defaultValue={m.percent} aria-label="Porcentaje" />
                <span>%</span>
                <button className="btn btn-outline">Cambiar</button>
              </form>
              <form action={removeBookDiscount}>
                <input type="hidden" name="campaignId" value={m.campaign_id} />
                <input type="hidden" name="bookId" value={bookId} />
                <input type="hidden" name="back" value={back} />
                <button className="btn btn-outline pill-danger">Quitar</button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-empty">Este libro no está en ninguna campaña.</p>
      )}

      {price !== null && campaigns.rows.length ? (
        <form action={setBookDiscount} className="admin-inline-form admin-book-discount-add">
          <input type="hidden" name="bookId" value={bookId} />
          <input type="hidden" name="back" value={back} />
          <select name="campaignId" required defaultValue="" aria-label="Campaña">
            <option value="" disabled>
              Agregar a campaña…
            </option>
            {campaigns.rows.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({STATE[c.state].label.toLowerCase()})
              </option>
            ))}
          </select>
          <input type="number" name="percent" min={1} max={90} defaultValue={30} required aria-label="Porcentaje" />
          <span>%</span>
          <button className="btn btn-primary">Agregar</button>
        </form>
      ) : null}
      {!campaigns.rows.length && !memberships.rows.length ? (
        <p className="admin-sub">
          <Link href="/admin/descuentos">Crear una campaña</Link> para aplicar descuentos.
        </p>
      ) : null}
    </section>
  );
}
