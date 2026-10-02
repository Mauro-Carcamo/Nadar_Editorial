import Link from "next/link";
import { ORDER_STATUS, PAYMENT_STATUS, dateTime, money, tone } from "@/components/admin/format";
import { getDashboardMetrics } from "@/services/admin/metrics";

export const dynamic = "force-dynamic";

const FUNNEL_LABEL: Record<string, string> = {
  page_view: "Visitas",
  book_view: "Vieron un libro",
  add_to_cart: "Agregaron al carrito",
  checkout_start: "Iniciaron el pago",
  purchase: "Compraron",
};

export default async function AdminDashboard() {
  const m = await getDashboardMetrics();
  const max = Math.max(1, ...m.salesByDay.map((d) => d.revenue));

  const kpis = [
    { label: "Ventas", value: money(m.kpis.revenue) },
    { label: "Pedidos pagados", value: m.kpis.orders },
    { label: "Ticket promedio", value: money(m.kpis.aov) },
    { label: "Clientes", value: m.kpis.customers },
    { label: "Libros publicados", value: m.kpis.products },
    { label: "Conversión de carritos", value: `${Math.round(m.kpis.conversion * 100)}%` },
    { label: "Carritos abandonados", value: m.kpis.abandoned },
    { label: "Mensajes sin leer", value: m.unreadMessages, href: "/admin/mensajes" },
  ];
  const top = Math.max(1, m.funnel[0].sessions);

  return (
    <>
      <header className="admin-head">
        <p className="eyebrow">Dashboard</p>
        <h2>Resumen comercial</h2>
      </header>

      <div className="admin-kpi-grid">
        {kpis.map((k) => (
          <article key={k.label} className="admin-kpi-card">
            <p>{k.href ? <Link href={k.href}>{k.label}</Link> : k.label}</p>
            <strong>{k.value}</strong>
          </article>
        ))}
      </div>

      <section className="admin-panel admin-chart" aria-labelledby="sales-14">
        <h3 id="sales-14">Ventas de los últimos 14 días</h3>
        <ol className="admin-bars">
          {m.salesByDay.map((d) => (
            <li key={d.day} title={`${d.day}: ${money(d.revenue)} · ${d.orders} pedidos`}>
              <span style={{ height: `${(d.revenue / max) * 100}%` }} />
              <small>{d.day}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="admin-panel" aria-labelledby="funnel-30">
        <h3 id="funnel-30">Embudo de conversión (30 días, sesiones únicas)</h3>
        <ol className="admin-funnel">
          {m.funnel.map((f) => (
            <li key={f.step}>
              <span className="admin-funnel-label">{FUNNEL_LABEL[f.step]}</span>
              <span className="admin-funnel-bar">
                <span style={{ width: `${(f.sessions / top) * 100}%` }} />
              </span>
              <strong>{f.sessions}</strong>
            </li>
          ))}
        </ol>
      </section>

      <div className="admin-panel-grid">
        <section className="admin-panel">
          <h3>Pedidos recientes</h3>
          {m.recentOrders.length ? (
            <table className="admin-table">
              <tbody>
                {m.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/pedidos/${o.id}`}>#{o.order_number}</Link>
                    </td>
                    <td>{o.customer_name ?? o.email}</td>
                    <td>{money(o.total)}</td>
                    <td>
                      <span className={`admin-badge ${tone(o.status)}`}>{ORDER_STATUS[o.status] ?? o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Aún no hay pedidos.</p>
          )}
        </section>

        <section className="admin-panel">
          <h3>Pagos recientes</h3>
          {m.recentPayments.length ? (
            <table className="admin-table">
              <tbody>
                {m.recentPayments.map((p, i) => (
                  <tr key={i}>
                    <td>#{p.order_number}</td>
                    <td>{p.provider}</td>
                    <td>{money(p.amount)}</td>
                    <td>
                      <span className={`admin-badge ${tone(p.status)}`}>{PAYMENT_STATUS[p.status] ?? p.status}</span>
                    </td>
                    <td>{dateTime(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Aún no hay pagos.</p>
          )}
        </section>

        <section className="admin-panel">
          <h3>Stock bajo (3 o menos)</h3>
          {m.lowStock.length ? (
            <table className="admin-table">
              <tbody>
                {m.lowStock.map((b) => (
                  <tr key={b.slug}>
                    <td>{b.title}</td>
                    <td>{b.available} disp.</td>
                    <td>{b.reserved} reserv.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Ningún libro a la venta con stock bajo.</p>
          )}
        </section>

        <section className="admin-panel">
          <h3>Libros más vendidos</h3>
          {m.topBooks.length ? (
            <table className="admin-table">
              <tbody>
                {m.topBooks.map((b) => (
                  <tr key={b.title}>
                    <td>{b.title}</td>
                    <td>{b.units} u.</td>
                    <td>{money(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">Se llenará con las primeras ventas.</p>
          )}
        </section>
      </div>
    </>
  );
}
