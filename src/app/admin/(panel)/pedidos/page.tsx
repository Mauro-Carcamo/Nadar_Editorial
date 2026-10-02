import Link from "next/link";
import { ORDER_STATUS, PAYMENT_STATUS, dateTime, money, tone } from "@/components/admin/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ p?: string; estado?: string }> }) {
  const { p, estado } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const status = estado && estado in ORDER_STATUS ? estado : null;

  const { rows } = await query<{
    id: string;
    order_number: number;
    customer_name: string | null;
    email: string;
    total: number;
    status: string;
    created_at: Date;
    payment_status: string | null;
    provider: string | null;
    items: number;
    full_count: number;
  }>(
    `SELECT o.id, o.order_number, o.customer_name, o.email, o.total, o.status, o.created_at,
            pay.status AS payment_status, pay.provider,
            (SELECT sum(quantity) FROM order_items oi WHERE oi.order_id = o.id)::int AS items,
            count(*) OVER()::int AS full_count
     FROM orders o
     LEFT JOIN LATERAL (SELECT status, provider FROM payments WHERE order_id = o.id ORDER BY updated_at DESC LIMIT 1) pay ON true
     WHERE ($1::text IS NULL OR o.status = $1)
     ORDER BY o.created_at DESC LIMIT $2 OFFSET $3`,
    [status, PAGE, (page - 1) * PAGE],
  );
  const total = rows[0]?.full_count ?? 0;

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Operación</p>
        <h2>Pedidos</h2>
      </header>
      <nav className="admin-filters" aria-label="Filtrar por estado">
        <Link href="/admin/pedidos" className={!status ? "is-active" : ""}>
          Todos
        </Link>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <Link key={k} href={`/admin/pedidos?estado=${k}`} className={status === k ? "is-active" : ""}>
            {v}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Libros</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/pedidos/${o.id}`}>#{o.order_number}</Link>
                  </td>
                  <td>
                    {o.customer_name}
                    <small className="admin-sub">{o.email}</small>
                  </td>
                  <td>{dateTime(o.created_at)}</td>
                  <td>{o.items}</td>
                  <td>{money(o.total)}</td>
                  <td>
                    {o.payment_status ? (
                      <span className={`admin-badge ${tone(o.payment_status)}`}>
                        {o.provider} · {PAYMENT_STATUS[o.payment_status]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge ${tone(o.status)}`}>{ORDER_STATUS[o.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No hay pedidos{status ? " con este estado" : ""}.</p>
      )}
      {total > PAGE ? (
        <nav className="admin-pager">
          {page > 1 ? <Link href={`/admin/pedidos?p=${page - 1}${status ? `&estado=${status}` : ""}`}>← Anteriores</Link> : <span />}
          <span>
            Página {page} de {Math.ceil(total / PAGE)}
          </span>
          {page * PAGE < total ? <Link href={`/admin/pedidos?p=${page + 1}${status ? `&estado=${status}` : ""}`}>Siguientes →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
