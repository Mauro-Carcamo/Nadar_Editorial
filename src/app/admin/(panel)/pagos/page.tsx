import Link from "next/link";
import { PAYMENT_STATUS, dateTime, money, tone } from "@/components/admin/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const { rows } = await query<{
    id: string;
    order_id: string;
    order_number: number;
    provider: string;
    provider_payment_id: string | null;
    buy_order: string;
    amount: number;
    status: string;
    payment_method: string | null;
    created_at: Date;
  }>(
    `SELECT p.id, p.order_id, o.order_number, p.provider, p.provider_payment_id, p.buy_order, p.amount, p.status,
            p.payment_method, p.created_at
     FROM payments p JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 100`,
  );

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Pagos</p>
        <h2>Transacciones</h2>
        <p className="admin-sub">Últimas 100. Cada intento de pago es una fila (un pedido puede tener varios).</p>
      </header>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Orden de compra</th>
                <th>Pedido</th>
                <th>Proveedor</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Método</th>
                <th>Fecha</th>
                <th>ID proveedor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.buy_order}</td>
                  <td>
                    <Link href={`/admin/pedidos/${p.order_id}`}>#{p.order_number}</Link>
                  </td>
                  <td>{p.provider}</td>
                  <td>{money(p.amount)}</td>
                  <td>
                    <span className={`admin-badge ${tone(p.status)}`}>{PAYMENT_STATUS[p.status]}</span>
                  </td>
                  <td>{p.payment_method ?? "—"}</td>
                  <td>{dateTime(p.created_at)}</td>
                  <td className="admin-mono">{p.provider_payment_id ? `${p.provider_payment_id.slice(0, 12)}…` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">Aún no hay pagos.</p>
      )}
    </>
  );
}
