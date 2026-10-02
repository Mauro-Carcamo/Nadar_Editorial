import { query, transaction } from "@/lib/db";
import { cancelOrder } from "@/services/checkout/checkout-service";
import type { VerifiedPayment } from "@/services/payments/types";
import { webpayProvider } from "@/services/payments/webpay";

export type ConfirmOutcome = {
  orderId: string | null;
  orderNumber: number | null;
  status: "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" | "UNKNOWN";
  duplicate: boolean;
};

/** Registra el evento del proveedor. Devuelve false si ya existía (idempotencia por UNIQUE(provider, event_key)). */
async function registerEvent(provider: string, eventKey: string, eventType: string, payload: unknown) {
  const r = await query(
    `INSERT INTO payment_events (provider, event_key, event_type, payload) VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, event_key) DO NOTHING RETURNING id`,
    [provider, eventKey, eventType, JSON.stringify(payload ?? null)],
  );
  return r.rowCount === 1;
}

async function currentOutcome(providerPaymentId: string, duplicate: boolean): Promise<ConfirmOutcome> {
  const r = await query<{ order_id: string; order_number: number; status: ConfirmOutcome["status"] }>(
    `SELECT p.order_id, o.order_number, p.status FROM payments p JOIN orders o ON o.id = p.order_id
     WHERE p.provider_payment_id = $1`,
    [providerPaymentId],
  );
  const row = r.rows[0];
  return row
    ? { orderId: row.order_id, orderNumber: row.order_number, status: row.status, duplicate }
    : { orderId: null, orderNumber: null, status: "UNKNOWN", duplicate };
}

/**
 * Webpay: el cliente vuelve con token_ws (pago terminado) o con TBK_TOKEN (pago abortado).
 * Pipeline: evento → verificar con Transbank → actualizar pago → actualizar pedido → descontar inventario.
 */
export async function confirmWebpay(params: { tokenWs?: string | null; tbkToken?: string | null }): Promise<ConfirmOutcome> {
  // Pago abortado por el cliente o por tiempo de espera
  if (!params.tokenWs && params.tbkToken) {
    const fresh = await registerEvent("webpay", `${params.tbkToken}:abort`, "ABORTED", params);
    const outcome = await currentOutcome(params.tbkToken, !fresh);
    if (fresh) {
      await query(
        `UPDATE payment_events SET result = 'APPLIED',
           payment_id = (SELECT id FROM payments WHERE provider = 'webpay' AND provider_payment_id = $2)
         WHERE provider = 'webpay' AND event_key = $1`,
        [`${params.tbkToken}:abort`, params.tbkToken],
      );
    }
    if (fresh && outcome.orderId && outcome.status === "PENDING") {
      await cancelOrder(outcome.orderId, "Pago abortado en Webpay", "CANCELLED");
      return { ...outcome, status: "CANCELLED" };
    }
    return outcome;
  }

  const token = params.tokenWs;
  if (!token) return { orderId: null, orderNumber: null, status: "UNKNOWN", duplicate: false };

  // Si el retorno llega dos veces, la segunda no vuelve a confirmar (Transbank solo permite un commit por token)
  const fresh = await registerEvent("webpay", `${token}:commit`, "COMMIT", { token });
  if (!fresh) return currentOutcome(token, true);

  let verified: VerifiedPayment;
  try {
    verified = await webpayProvider.commitTransaction(token);
  } catch (error) {
    await query(`UPDATE payment_events SET result = 'ERROR', error = $3 WHERE provider = $1 AND event_key = $2`, [
      "webpay",
      `${token}:commit`,
      error instanceof Error ? error.message : String(error),
    ]);
    const outcome = await currentOutcome(token, false);
    if (outcome.orderId && outcome.status === "PENDING") {
      await cancelOrder(outcome.orderId, "Webpay rechazó la confirmación", "REJECTED");
      return { ...outcome, status: "REJECTED" };
    }
    return outcome;
  }

  return applyVerifiedPayment("webpay", token, `${token}:commit`, verified);
}

/** Aplica un pago verificado: pago, pedido e inventario en una sola transacción. */
async function applyVerifiedPayment(
  provider: string,
  providerPaymentId: string,
  eventKey: string,
  verified: VerifiedPayment,
): Promise<ConfirmOutcome> {
  const result = await transaction(async (client) => {
    const p = await client.query<{ id: string; order_id: string; amount: number; status: string; buy_order: string }>(
      `SELECT id, order_id, amount, status, buy_order FROM payments WHERE provider = $1 AND provider_payment_id = $2 FOR UPDATE`,
      [provider, providerPaymentId],
    );
    const payment = p.rows[0];
    if (!payment) return { status: "UNKNOWN" as const, orderId: null };

    await client.query(`UPDATE payment_events SET payment_id = $3, payload = $4 WHERE provider = $1 AND event_key = $2`, [
      provider,
      eventKey,
      payment.id,
      JSON.stringify(verified.raw),
    ]);

    if (payment.status !== "PENDING") {
      // Caso borde: el proveedor aprueba un pago cuyo pedido ya se canceló (p. ej. por vencimiento).
      // No se aplica automáticamente ni se ignora: queda marcado para revisión y reembolso manual.
      if (verified.approved && payment.status === "CANCELLED") {
        await client.query(`UPDATE payment_events SET result = 'NEEDS_REVIEW', error = $3 WHERE provider = $1 AND event_key = $2`, [
          provider,
          eventKey,
          "Pago aprobado por el proveedor sobre un pedido ya cancelado",
        ]);
        await client.query(
          `INSERT INTO audit_log (action, entity, entity_id, metadata) VALUES ('PAYMENT_NEEDS_REVIEW', 'PAYMENT', $1, $2)`,
          [payment.id, JSON.stringify({ orderId: payment.order_id, amount: verified.amount, buyOrder: verified.buyOrder })],
        );
      }
      return { status: payment.status as ConfirmOutcome["status"], orderId: payment.order_id };
    }

    // El monto y la orden confirmados por el proveedor deben coincidir con lo registrado
    const consistent = verified.amount === payment.amount && verified.buyOrder === payment.buy_order;
    const approved = verified.approved && consistent;

    await client.query(
      `UPDATE payments SET status = $2, authorization_code = $3, payment_method = $4, card_last4 = $5, raw_response = $6
       WHERE id = $1`,
      [payment.id, approved ? "APPROVED" : "REJECTED", verified.authorizationCode ?? null, verified.paymentMethod ?? null,
       verified.cardLast4 ?? null, JSON.stringify(verified.raw)],
    );
    await client.query(`UPDATE payment_events SET result = $3 WHERE provider = $1 AND event_key = $2`, [
      provider,
      eventKey,
      approved ? "APPLIED" : consistent ? "REJECTED" : "AMOUNT_MISMATCH",
    ]);

    if (!approved) return { status: "REJECTED" as const, orderId: payment.order_id };

    const o = await client.query<{ status: string }>("SELECT status FROM orders WHERE id = $1 FOR UPDATE", [payment.order_id]);
    await client.query("UPDATE orders SET status = 'PAID' WHERE id = $1", [payment.order_id]);
    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, source, note) VALUES ($1, $2, 'PAID', 'callback', $3)`,
      [payment.order_id, o.rows[0]?.status ?? null, `Pago ${provider} aprobado`],
    );

    // Venta: la reserva se convierte en descuento de stock
    const items = await client.query<{ book_id: string; quantity: number }>(
      "SELECT book_id, quantity FROM order_items WHERE order_id = $1 AND book_id IS NOT NULL",
      [payment.order_id],
    );
    for (const it of items.rows) {
      await client.query(
        "UPDATE inventory SET stock = stock - $2, reserved = GREATEST(reserved - $2, 0) WHERE book_id = $1",
        [it.book_id, it.quantity],
      );
      await client.query(
        `INSERT INTO inventory_movements (book_id, delta_stock, delta_reserved, reason, order_id) VALUES ($1, $2, $3, 'SALE', $4)`,
        [it.book_id, -it.quantity, -it.quantity, payment.order_id],
      );
    }
    return { status: "APPROVED" as const, orderId: payment.order_id };
  });

  // Pago rechazado: se libera la reserva y se cancela el pedido (fuera de la transacción anterior)
  if (result.status === "REJECTED" && result.orderId) {
    await cancelOrder(result.orderId, "Pago rechazado por el proveedor", "REJECTED");
  }
  return currentOutcome(providerPaymentId, false);
}
