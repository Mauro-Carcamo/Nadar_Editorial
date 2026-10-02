import { query } from "@/lib/db";
import { expireStalePendingOrders } from "@/services/orders/expire";

// Métricas del dashboard. Ventas = pedidos pagados o posteriores (no pendientes ni cancelados).
const SOLD = "('PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED')";

export async function getDashboardMetrics() {
  await expireStalePendingOrders();
  const [kpis, recentOrders, recentPayments, lowStock, salesByDay, topBooks, funnel, messages] = await Promise.all([
    query<{
      revenue: number;
      orders: number;
      customers: number;
      products: number;
      aov: number;
      carts: number;
      converted: number;
      abandoned: number;
    }>(`SELECT
          COALESCE((SELECT sum(total) FROM orders WHERE status IN ${SOLD}), 0)::int AS revenue,
          (SELECT count(*) FROM orders WHERE status IN ${SOLD})::int AS orders,
          (SELECT count(*) FROM customers)::int AS customers,
          (SELECT count(*) FROM books WHERE status = 'PUBLISHED')::int AS products,
          COALESCE((SELECT round(avg(total)) FROM orders WHERE status IN ${SOLD}), 0)::int AS aov,
          (SELECT count(*) FROM carts)::int AS carts,
          (SELECT count(*) FROM carts WHERE status = 'CONVERTED')::int AS converted,
          (SELECT count(*) FROM carts WHERE status = 'ACTIVE' AND last_activity_at < now() - interval '24 hours'
                                                  AND EXISTS (SELECT 1 FROM cart_items ci WHERE ci.cart_id = carts.id))::int AS abandoned`),
    query<{ id: string; order_number: number; customer_name: string | null; email: string; total: number; status: string; created_at: Date }>(
      `SELECT id, order_number, customer_name, email, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 6`,
    ),
    query<{ order_number: number; provider: string; amount: number; status: string; created_at: Date }>(
      `SELECT o.order_number, p.provider, p.amount, p.status, p.created_at
       FROM payments p JOIN orders o ON o.id = p.order_id ORDER BY p.created_at DESC LIMIT 6`,
    ),
    query<{ title: string; slug: string; stock: number; reserved: number; available: number }>(
      `SELECT b.title, b.slug, i.stock, i.reserved, i.available FROM inventory i JOIN books b ON b.id = i.book_id
       WHERE b.price IS NOT NULL AND b.status = 'PUBLISHED' AND i.available <= 3 ORDER BY i.available, b.title LIMIT 8`,
    ),
    query<{ day: string; revenue: number; orders: number }>(
      `SELECT to_char(d.date, 'DD/MM') AS day, COALESCE(sum(f.net_amount), 0)::int AS revenue,
              count(DISTINCT f.order_id)::int AS orders
       FROM analytics.dim_date d LEFT JOIN analytics.fact_sales f ON f.date_key = d.date_key
       WHERE d.date BETWEEN current_date - 13 AND current_date
       GROUP BY d.date ORDER BY d.date`,
    ),
    query<{ title: string; units: number; revenue: number }>(
      `SELECT b.title, sum(f.quantity)::int AS units, sum(f.net_amount)::int AS revenue
       FROM analytics.fact_sales f JOIN analytics.dim_book b ON b.book_key = f.book_key
       GROUP BY b.title ORDER BY units DESC LIMIT 5`,
    ),
    // Embudo de los últimos 30 días: sesiones únicas por paso (estrella) + pedidos pagados (OLTP)
    query<{ step: string; sessions: number }>(
      `SELECT e.event_type AS step, count(DISTINCT e.session_id)::int AS sessions
       FROM analytics_events e
       WHERE e.created_at >= current_date - 29 AND e.event_type IN ('page_view', 'book_view', 'add_to_cart', 'checkout_start')
       GROUP BY e.event_type
       UNION ALL
       SELECT 'purchase', count(*)::int FROM orders WHERE status IN ${SOLD} AND created_at >= current_date - 29`,
    ),
    query<{ unread: number }>("SELECT count(*)::int AS unread FROM contact_messages WHERE status = 'NEW'"),
  ]);

  const k = kpis.rows[0];
  return {
    kpis: { ...k, conversion: k.carts ? k.converted / k.carts : 0 },
    recentOrders: recentOrders.rows,
    recentPayments: recentPayments.rows,
    lowStock: lowStock.rows,
    salesByDay: salesByDay.rows,
    topBooks: topBooks.rows,
    funnel: ["page_view", "book_view", "add_to_cart", "checkout_start", "purchase"].map((step) => ({
      step,
      sessions: funnel.rows.find((r) => r.step === step)?.sessions ?? 0,
    })),
    unreadMessages: messages.rows[0].unread,
  };
}
