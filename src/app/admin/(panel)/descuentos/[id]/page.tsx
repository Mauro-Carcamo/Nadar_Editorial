import Link from "next/link";
import { notFound } from "next/navigation";
import { money } from "@/components/admin/format";
import { discountedPrice } from "@/data/book-utils";
import { query } from "@/lib/db";
import { deleteCampaign, removeBookDiscount, setBookDiscount } from "../actions";
import { BookPicker } from "../BookPicker";
import { CampaignForm } from "../CampaignForm";

export const dynamic = "force-dynamic";

const LOCAL = `'YYYY-MM-DD"T"HH24:MI'`;

export default async function AdminCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { id } = await params;
  const { error, ok } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const campaign = (
    await query<{
      id: string;
      name: string;
      slug: string;
      badge_label: string;
      headline: string | null;
      description: string | null;
      starts_local: string;
      ends_local: string | null;
      is_active: boolean;
      show_banner: boolean;
    }>(
      `SELECT id, name, slug, badge_label, headline, description, is_active, show_banner,
              to_char(starts_at AT TIME ZONE 'America/Santiago', ${LOCAL}) AS starts_local,
              to_char(ends_at AT TIME ZONE 'America/Santiago', ${LOCAL}) AS ends_local
       FROM discount_campaigns WHERE id = $1`,
      [id],
    )
  ).rows[0];
  if (!campaign) notFound();

  const [discounts, candidates] = await Promise.all([
    query<{ book_id: string; title: string; slug: string; price: number | null; status: string; percent: number }>(
      `SELECT b.id AS book_id, b.title, b.slug, b.price, b.status, bd.percent
       FROM book_discounts bd JOIN books b ON b.id = bd.book_id
       WHERE bd.campaign_id = $1 ORDER BY bd.percent DESC, b.title`,
      [id],
    ),
    query<{ id: string; title: string; authors: string | null; price: number | null }>(
      `SELECT b.id, b.title, b.price,
              (SELECT string_agg(a.name, ', ' ORDER BY ba.position) FROM book_authors ba JOIN authors a ON a.id = ba.author_id
                WHERE ba.book_id = b.id AND ba.role IN ('author', 'editor', 'coordinator')) AS authors
       FROM books b
       WHERE b.status = 'PUBLISHED'
         AND NOT EXISTS (SELECT 1 FROM book_discounts bd WHERE bd.campaign_id = $1 AND bd.book_id = b.id)
       ORDER BY b.title`,
      [id],
    ),
  ]);

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">
          <Link href="/admin/descuentos">Descuentos</Link> / Campaña
        </p>
        <h2>{campaign.name}</h2>
      </header>

      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}
      {ok ? <p className="admin-ok">Cambios guardados.</p> : null}

      <section className="admin-panel">
        <h3>Libros con descuento</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Libro</th>
                <th>Precio normal</th>
                <th>Descuento</th>
                <th>Precio final</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {discounts.rows.map((d) => (
                <tr key={d.book_id}>
                  <td>
                    <Link href={`/admin/libros/${d.book_id}`}>{d.title}</Link>
                    {d.status !== "PUBLISHED" ? <small> (no publicado)</small> : null}
                  </td>
                  <td>{d.price !== null ? money(d.price) : "Sin precio"}</td>
                  <td>
                    <form action={setBookDiscount} className="admin-inline-form">
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <input type="hidden" name="bookId" value={d.book_id} />
                      <input type="number" name="percent" min={1} max={90} defaultValue={d.percent} aria-label="Porcentaje" />
                      <span>%</span>
                      <button className="btn btn-outline">Cambiar</button>
                    </form>
                  </td>
                  <td>
                    <strong>{d.price !== null ? money(discountedPrice(d.price, d.percent)) : "—"}</strong>
                  </td>
                  <td>
                    <form action={removeBookDiscount}>
                      <input type="hidden" name="campaignId" value={campaign.id} />
                      <input type="hidden" name="bookId" value={d.book_id} />
                      <button className="btn btn-outline pill-danger">Quitar</button>
                    </form>
                  </td>
                </tr>
              ))}
              {!discounts.rows.length ? (
                <tr>
                  <td colSpan={5}>Esta campaña aún no tiene libros.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <h4 className="admin-subhead">Agregar libros</h4>
        <form action={setBookDiscount} className="admin-discount-add">
          <input type="hidden" name="campaignId" value={campaign.id} />
          <BookPicker options={candidates.rows} />
        </form>
      </section>

      <section className="admin-panel">
        <h3>Datos de la campaña</h3>
        <CampaignForm
          submitLabel="Guardar campaña"
          values={{
            id: campaign.id,
            name: campaign.name,
            slug: campaign.slug,
            badgeLabel: campaign.badge_label,
            headline: campaign.headline ?? "",
            description: campaign.description ?? "",
            startsAt: campaign.starts_local,
            endsAt: campaign.ends_local ?? "",
            isActive: campaign.is_active,
            showBanner: campaign.show_banner,
          }}
        />
      </section>

      <form action={deleteCampaign} className="admin-danger-zone">
        <input type="hidden" name="id" value={campaign.id} />
        <button className="btn btn-outline pill-danger">Eliminar campaña</button>
        <small>Quita la campaña y todos sus descuentos. Los pedidos ya pagados conservan su precio.</small>
      </form>
    </>
  );
}
