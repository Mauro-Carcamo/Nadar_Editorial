import Link from "next/link";
import { dateTime } from "@/components/admin/format";
import { query } from "@/lib/db";
import { CampaignForm } from "./CampaignForm";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  badge_label: string;
  starts_at: Date;
  ends_at: Date | null;
  is_active: boolean;
  show_banner: boolean;
  book_count: number;
  max_percent: number | null;
  state: "VIGENTE" | "PROGRAMADA" | "TERMINADA" | "INACTIVA";
};

const STATE: Record<Row["state"], { label: string; tone: string }> = {
  VIGENTE: { label: "Vigente", tone: "is-ok" },
  PROGRAMADA: { label: "Programada", tone: "is-wait" },
  TERMINADA: { label: "Terminada", tone: "is-bad" },
  INACTIVA: { label: "Inactiva", tone: "is-bad" },
};

export default async function AdminDiscountsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const { rows } = await query<Row>(
    `SELECT dc.id, dc.name, dc.badge_label, dc.starts_at, dc.ends_at, dc.is_active, dc.show_banner,
            count(bd.id)::int AS book_count, max(bd.percent)::int AS max_percent,
            CASE WHEN NOT dc.is_active THEN 'INACTIVA'
                 WHEN dc.starts_at > now() THEN 'PROGRAMADA'
                 WHEN dc.ends_at IS NOT NULL AND dc.ends_at <= now() THEN 'TERMINADA'
                 ELSE 'VIGENTE' END AS state
     FROM discount_campaigns dc LEFT JOIN book_discounts bd ON bd.campaign_id = dc.id
     GROUP BY dc.id
     ORDER BY dc.starts_at DESC`,
  );

  // Valor por defecto del formulario: hoy a las 00:00 (hora de Chile)
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Santiago" }).format(new Date());

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Comercial</p>
        <h2>Descuentos y campañas</h2>
        <p className="admin-sub">
          Cada campaña (Cyber, aniversario…) tiene fechas y un porcentaje por libro. Mientras está vigente, el descuento
          aparece en todas las portadas del libro con un círculo rojo, el precio baja en catálogo, carrito y pago, y el
          catálogo suma el filtro con el nombre de la campaña.
        </p>
      </header>

      {error ? <p className="admin-error">{decodeURIComponent(error)}</p> : null}
      {ok ? <p className="admin-ok">Cambios guardados.</p> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Campaña</th>
              <th>Estado</th>
              <th>Inicio</th>
              <th>Término</th>
              <th>Libros</th>
              <th>Máx.</th>
              <th>Banner</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.name}</strong>
                  <br />
                  <small>Círculo: «Descuento {c.badge_label}»</small>
                </td>
                <td>
                  <span className={`admin-badge ${STATE[c.state].tone}`}>{STATE[c.state].label}</span>
                </td>
                <td>{dateTime(c.starts_at)}</td>
                <td>{c.ends_at ? dateTime(c.ends_at) : "Sin término"}</td>
                <td>{c.book_count}</td>
                <td>{c.max_percent ? `${c.max_percent}%` : "—"}</td>
                <td>{c.show_banner ? "Sí" : "No"}</td>
                <td>
                  <Link href={`/admin/descuentos/${c.id}`} className="btn btn-outline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8}>Aún no hay campañas.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="admin-panel admin-discount-new">
        <h3>Nueva campaña</h3>
        <CampaignForm
          submitLabel="Crear campaña"
          values={{
            name: "",
            slug: "",
            badgeLabel: "Cyber",
            headline: "",
            description: "",
            startsAt: `${today}T00:00`,
            endsAt: "",
            isActive: true,
            showBanner: true,
          }}
        />
      </section>
    </>
  );
}
