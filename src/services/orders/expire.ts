import { query } from "@/lib/db";
import { cancelOrder } from "@/services/checkout/checkout-service";

// Un pedido que se abandona en la página del proveedor queda "esperando pago" con stock reservado.
// Pasado este tiempo (mayor que la vida del formulario de Webpay) se cancela y la reserva se libera.
export const PAYMENT_TIMEOUT_MINUTES = 15;

export async function expireStalePendingOrders() {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM orders WHERE status = 'PAYMENT_PENDING' AND created_at < now() - make_interval(mins => $1) LIMIT 50`,
    [PAYMENT_TIMEOUT_MINUTES],
  );
  for (const row of rows) {
    await cancelOrder(row.id, `Pago no completado en ${PAYMENT_TIMEOUT_MINUTES} minutos (expirado)`, "CANCELLED");
  }
  return rows.length;
}
