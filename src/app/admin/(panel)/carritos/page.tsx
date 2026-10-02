import Link from "next/link";
import { CART_STATUS, dateTime, money, tone } from "@/components/admin/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Solo consulta: los carritos de clientes no se modifican desde el panel.
export default async function AdminCartsPage() {
  const { rows } = await query<{
    id: string;
    status: string;
    email: string | null;
    items: number;
    value: number;
    created_at: Date;
    last_activity_at: Date;
    converted_order_id: string | null;
  }>(
    `SELECT c.id,
            CASE WHEN c.status = 'ACTIVE' AND c.last_activity_at < now() - interval '24 hours' THEN 'ABANDONED' ELSE c.status END AS status,
            cu.email,
            COALESCE(sum(ci.quantity), 0)::int AS items,
            COALESCE(sum(ci.quantity * ci.unit_price), 0)::int AS value,
            c.created_at, c.last_activity_at, c.converted_order_id
     FROM carts c
     LEFT JOIN cart_items ci ON ci.cart_id = c.id
     LEFT JOIN customers cu ON cu.id = c.customer_id
     GROUP BY c.id, cu.email
     HAVING COALESCE(sum(ci.quantity), 0) > 0 OR c.status = 'CONVERTED'
     ORDER BY c.last_activity_at DESC LIMIT 100`,
  );

  const by = (s: string) => rows.filter((r) => r.status === s);
  const summary = ["ACTIVE", "ABANDONED", "CONVERTED"].map((s) => ({
    status: s,
    count: by(s).length,
    value: by(s).reduce((n, r) => n + r.value, 0),
  }));

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Comercio</p>
        <h2>Carritos</h2>
        <p className="admin-sub">Un carrito se considera abandonado tras 24 horas sin actividad.</p>
      </header>
      <div className="admin-kpi-grid">
        {summary.map((s) => (
          <article key={s.status} className="admin-kpi-card">
            <p>{CART_STATUS[s.status]}</p>
            <strong>{s.count}</strong>
            <small>{money(s.value)}</small>
          </article>
        ))}
      </div>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Cliente</th>
                <th>Libros</th>
                <th>Valor</th>
                <th>Creado</th>
                <th>Última actividad</th>
                <th>Pedido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className={`admin-badge ${tone(c.status)}`}>{CART_STATUS[c.status]}</span>
                  </td>
                  <td>{c.email ?? "Invitado"}</td>
                  <td>{c.items}</td>
                  <td>{money(c.value)}</td>
                  <td>{dateTime(c.created_at)}</td>
                  <td>{dateTime(c.last_activity_at)}</td>
                  <td>{c.converted_order_id ? <Link href={`/admin/pedidos/${c.converted_order_id}`}>Ver</Link> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">Aún no hay carritos guardados.</p>
      )}
    </>
  );
}
