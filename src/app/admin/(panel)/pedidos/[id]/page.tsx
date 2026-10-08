import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_STATUS, PAYMENT_STATUS, dateTime, money, tone } from "@/components/admin/format";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

// Trazabilidad completa: carrito → pedido → pagos → eventos del proveedor → inventario
export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [order, items, payments, history, events, movements] = await Promise.all([
    query<{
      order_number: number;
      status: string;
      subtotal: number;
      shipping: number;
      discount: number;
      total: number;
      email: string;
      customer_name: string | null;
      shipping_zone: string | null;
      shipping_address: Record<string, string> | null;
      created_at: Date;
      cart_id: string | null;
    }>("SELECT * FROM orders WHERE id = $1", [id]),
    query<{
      title: string;
      isbn: string | null;
      quantity: number;
      unit_price: number;
      line_total: number;
      list_price: number | null;
      campaign_name: string | null;
    }>(
      "SELECT title, isbn, quantity, unit_price, line_total, list_price, campaign_name FROM order_items WHERE order_id = $1 ORDER BY created_at",
      [id],
    ),
    query<{ provider: string; buy_order: string; amount: number; status: string; authorization_code: string | null; payment_method: string | null; card_last4: string | null; created_at: Date }>(
      "SELECT provider, buy_order, amount, status, authorization_code, payment_method, card_last4, created_at FROM payments WHERE order_id = $1 ORDER BY created_at",
      [id],
    ),
    query<{ from_status: string | null; to_status: string; source: string; note: string | null; created_at: Date }>(
      "SELECT from_status, to_status, source, note, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at",
      [id],
    ),
    query<{ event_type: string; result: string | null; error: string | null; created_at: Date }>(
      `SELECT e.event_type, e.result, e.error, e.created_at FROM payment_events e
       JOIN payments p ON p.id = e.payment_id WHERE p.order_id = $1 ORDER BY e.created_at`,
      [id],
    ),
    query<{ title: string; reason: string; delta_stock: number; delta_reserved: number; created_at: Date }>(
      `SELECT b.title, m.reason, m.delta_stock, m.delta_reserved, m.created_at FROM inventory_movements m
       JOIN books b ON b.id = m.book_id WHERE m.order_id = $1 ORDER BY m.created_at`,
      [id],
    ),
  ]);
  const o = order.rows[0];
  if (!o) notFound();

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">
          <Link href="/admin/pedidos">Pedidos</Link> /
        </p>
        <h2>
          Pedido #{o.order_number} <span className={`admin-badge ${tone(o.status)}`}>{ORDER_STATUS[o.status]}</span>
        </h2>
        <p className="admin-sub">Creado {dateTime(o.created_at)}</p>
      </header>

      <div className="admin-panel-grid">
        <section className="admin-panel">
          <h3>Cliente</h3>
          <p>
            {o.customer_name}
            <br />
            {o.email}
          </p>
          <h3>Entrega</h3>
          <p>
            {o.shipping_zone}
            {o.shipping_address ? (
              <>
                <br />
                {[o.shipping_address.street, o.shipping_address.number, o.shipping_address.apartment].filter(Boolean).join(" ")},{" "}
                {o.shipping_address.commune}, {o.shipping_address.region}
              </>
            ) : null}
          </p>
        </section>

        <section className="admin-panel">
          <h3>Montos</h3>
          <dl className="admin-dl">
            <dt>Subtotal</dt>
            <dd>{money(o.subtotal)}</dd>
            <dt>Envío</dt>
            <dd>{money(o.shipping)}</dd>
            <dt>Descuento</dt>
            <dd>{money(o.discount)}</dd>
            <dt>Total</dt>
            <dd>
              <strong>{money(o.total)}</strong>
            </dd>
          </dl>
        </section>
      </div>

      <section className="admin-panel">
        <h3>Libros</h3>
        <table className="admin-table">
          <tbody>
            {items.rows.map((it, i) => (
              <tr key={i}>
                <td>
                  {it.title}
                  {it.campaign_name ? <small className="admin-cell-sub admin-discount-tag">{it.campaign_name}</small> : null}
                </td>
                <td>{it.isbn ?? "—"}</td>
                <td>
                  {it.quantity} ×{" "}
                  {it.list_price ? <s className="admin-strike">{money(it.list_price)}</s> : null} {money(it.unit_price)}
                </td>
                <td>{money(it.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="admin-panel-grid">
        <section className="admin-panel">
          <h3>Pagos</h3>
          {payments.rows.map((p) => (
            <p key={p.buy_order}>
              <span className={`admin-badge ${tone(p.status)}`}>{PAYMENT_STATUS[p.status]}</span> {p.provider} · {money(p.amount)}
              <small className="admin-sub">
                Orden {p.buy_order}
                {p.authorization_code ? ` · autorización ${p.authorization_code}` : ""}
                {p.card_last4 ? ` · tarjeta ****${p.card_last4}` : ""} · {dateTime(p.created_at)}
              </small>
            </p>
          ))}
          <h3>Eventos del proveedor</h3>
          {events.rows.length ? (
            <ul className="admin-timeline">
              {events.rows.map((e, i) => (
                <li key={i}>
                  {dateTime(e.created_at)} · {e.event_type} → {e.result ?? "—"}
                  {e.error ? <small className="admin-sub">{e.error}</small> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty">Sin eventos.</p>
          )}
        </section>

        <section className="admin-panel">
          <h3>Historial de estado</h3>
          <ul className="admin-timeline">
            {history.rows.map((h, i) => (
              <li key={i}>
                {dateTime(h.created_at)} · {h.from_status ? `${ORDER_STATUS[h.from_status]} → ` : ""}
                <strong>{ORDER_STATUS[h.to_status]}</strong> ({h.source}){h.note ? <small className="admin-sub">{h.note}</small> : null}
              </li>
            ))}
          </ul>
          <h3>Inventario</h3>
          <ul className="admin-timeline">
            {movements.rows.map((m, i) => (
              <li key={i}>
                {dateTime(m.created_at)} · {m.reason} · {m.title}: stock {m.delta_stock}, reservado {m.delta_reserved > 0 ? "+" : ""}
                {m.delta_reserved}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
