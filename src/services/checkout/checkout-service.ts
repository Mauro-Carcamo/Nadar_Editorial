import crypto from "node:crypto";
import { query, transaction } from "@/lib/db";
import type { CheckoutInput } from "@/schemas/checkout";
import { getSellableBooks, validateLines, type LineProblem } from "@/services/catalog/sellable";
import { calculateTotals } from "@/services/orders/totals";
import { getPaymentProvider } from "@/services/payments";
import type { PaymentRedirect } from "@/services/payments/types";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public code: "INVALID_CART" | "PROVIDER_UNAVAILABLE" | "PROVIDER_ERROR",
    public problems: LineProblem[] = [],
  ) {
    super(message);
  }
}

export type CheckoutResult = {
  orderId: string;
  orderNumber: number;
  total: number;
  redirect: PaymentRedirect;
};

/**
 * Pipeline de compra (servidor):
 * validar carrito → validar stock → calcular total → crear pedido + reservar stock → crear pago → redirigir.
 * Ningún monto viene del navegador.
 */
export async function createCheckout(input: CheckoutInput, siteUrl: string): Promise<CheckoutResult> {
  const provider = getPaymentProvider(input.provider);
  if (!provider.isConfigured()) throw new CheckoutError("Medio de pago no disponible", "PROVIDER_UNAVAILABLE");

  // Libera primero el stock de pedidos abandonados para no bloquear esta compra
  const { expireStalePendingOrders } = await import("@/services/orders/expire");
  await expireStalePendingOrders();

  // Agrupa líneas repetidas del mismo libro
  const lines = Object.values(
    input.items.reduce<Record<string, { slug: string; quantity: number }>>((acc, l) => {
      acc[l.slug] = { slug: l.slug, quantity: (acc[l.slug]?.quantity ?? 0) + l.quantity };
      return acc;
    }, {}),
  );

  const buyOrder = `N${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`.toUpperCase().slice(0, 26);

  const order = await transaction(async (client) => {
    // Bloquea el inventario de estos libros mientras se valida y reserva (evita sobreventa)
    await client.query(
      `SELECT i.book_id FROM inventory i JOIN books b ON b.id = i.book_id WHERE b.slug = ANY($1::text[]) FOR UPDATE OF i`,
      [lines.map((l) => l.slug)],
    );
    const books = await getSellableBooks(lines.map((l) => l.slug), client);
    const problems = validateLines(lines, books);
    if (problems.length) throw new CheckoutError("Hay libros que no se pueden comprar", "INVALID_CART", problems);

    const zone = await client.query<{ cost: number }>("SELECT cost FROM shipping_zones WHERE code = $1 AND is_active", [
      input.shippingZone,
    ]);
    if (!zone.rowCount) throw new CheckoutError("Zona de envío inválida", "INVALID_CART");

    const priced = lines.map((l) => ({ ...l, book: books.get(l.slug)!, unitPrice: books.get(l.slug)!.price! }));
    const totals = calculateTotals(priced, zone.rows[0].cost);

    const customer = await client.query<{ id: string }>(
      `INSERT INTO customers (email, full_name, phone) VALUES ($1, $2, NULLIF($3, ''))
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, phone = COALESCE(EXCLUDED.phone, customers.phone)
       RETURNING id`,
      [input.email, input.fullName, input.phone ?? ""],
    );
    const customerId = customer.rows[0].id;

    if (input.address) {
      await client.query(
        `INSERT INTO addresses (customer_id, recipient, street, number, apartment, commune, region, is_default)
         SELECT $1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), $6, $7, NOT EXISTS (SELECT 1 FROM addresses WHERE customer_id = $1)
         WHERE NOT EXISTS (SELECT 1 FROM addresses WHERE customer_id = $1 AND street = $3 AND coalesce(number, '') = $4 AND commune = $6)`,
        [customerId, input.fullName, input.address.street, input.address.number ?? "", input.address.apartment ?? "", input.address.commune, input.address.region],
      );
    }

    const cart = input.cartToken
      ? await client.query<{ id: string }>("SELECT id FROM carts WHERE guest_token = $1", [input.cartToken])
      : null;
    const cartId = cart?.rows[0]?.id ?? null;

    const created = await client.query<{ id: string; order_number: number }>(
      `INSERT INTO orders (customer_id, cart_id, status, subtotal, shipping, discount, total, shipping_zone, email,
                           customer_name, shipping_address)
       VALUES ($1, $2, 'PAYMENT_PENDING', $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, order_number`,
      [customerId, cartId, totals.subtotal, totals.shipping, totals.discount, totals.total, input.shippingZone,
       input.email, input.fullName, input.address ? JSON.stringify(input.address) : null],
    );
    const orderId = created.rows[0].id;

    for (const line of priced) {
      await client.query(
        `INSERT INTO order_items (order_id, book_id, title, isbn, quantity, unit_price, list_price, discount_percent, campaign_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, line.book.id, line.book.title, line.book.isbn, line.quantity, line.unitPrice,
         line.book.discount_percent ? line.book.list_price : null, line.book.discount_percent, line.book.campaign],
      );
      await client.query("UPDATE inventory SET reserved = reserved + $2 WHERE book_id = $1", [line.book.id, line.quantity]);
      await client.query(
        `INSERT INTO inventory_movements (book_id, delta_reserved, reason, order_id) VALUES ($1, $2, 'RESERVE', $3)`,
        [line.book.id, line.quantity, orderId],
      );
    }

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, source, note)
       VALUES ($1, NULL, 'PAYMENT_PENDING', 'system', 'Pedido creado en checkout')`,
      [orderId],
    );
    await client.query(
      `INSERT INTO payments (order_id, provider, buy_order, amount, status) VALUES ($1, $2, $3, $4, 'PENDING')`,
      [orderId, provider.name, buyOrder, totals.total],
    );
    if (cartId) {
      await client.query(`UPDATE carts SET status = 'CONVERTED', converted_order_id = $2, last_activity_at = now() WHERE id = $1`, [
        cartId,
        orderId,
      ]);
    }
    return { id: orderId, orderNumber: created.rows[0].order_number, total: totals.total };
  });

  // El pedido ya existe: se crea la transacción con el proveedor usando el total del servidor
  try {
    const redirect = await provider.createPayment({
      buyOrder,
      sessionId: order.id.slice(0, 61),
      amount: order.total,
      returnUrl: `${siteUrl}/api/payments/${provider.name}/return`,
      description: `Pedido #${order.orderNumber} · Nadar Ediciones`,
    });
    await query("UPDATE payments SET provider_payment_id = $2 WHERE buy_order = $1", [buyOrder, redirect.providerPaymentId]);
    return { orderId: order.id, orderNumber: order.orderNumber, total: order.total, redirect };
  } catch (error) {
    // Si el proveedor falla, se libera la reserva y se cancela el pedido
    await cancelOrder(order.id, "No se pudo iniciar el pago con el proveedor", "CANCELLED");
    throw new CheckoutError(error instanceof Error ? error.message : "Error del proveedor", "PROVIDER_ERROR");
  }
}

/** Libera las reservas de stock de un pedido y lo marca como cancelado (si aún no estaba pagado). */
export async function cancelOrder(orderId: string, note: string, paymentStatus: "CANCELLED" | "REJECTED") {
  await transaction(async (client) => {
    const o = await client.query<{ status: string }>("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
    if (!o.rowCount || !["PENDING", "PAYMENT_PENDING"].includes(o.rows[0].status)) return;
    const items = await client.query<{ book_id: string; quantity: number }>(
      "SELECT book_id, quantity FROM order_items WHERE order_id = $1 AND book_id IS NOT NULL",
      [orderId],
    );
    for (const it of items.rows) {
      await client.query("UPDATE inventory SET reserved = GREATEST(reserved - $2, 0) WHERE book_id = $1", [it.book_id, it.quantity]);
      await client.query(
        `INSERT INTO inventory_movements (book_id, delta_reserved, reason, order_id) VALUES ($1, $2, 'RELEASE', $3)`,
        [it.book_id, -it.quantity, orderId],
      );
    }
    await client.query("UPDATE orders SET status = 'CANCELLED' WHERE id = $1", [orderId]);
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, source, note) VALUES ($1, $2, 'CANCELLED', 'system', $3)`,
      [orderId, o.rows[0].status, note],
    );
    await client.query(`UPDATE payments SET status = $2 WHERE order_id = $1 AND status = 'PENDING'`, [orderId, paymentStatus]);
  });
}
