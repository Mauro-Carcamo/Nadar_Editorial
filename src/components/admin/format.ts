// Utilidades de presentación del panel.
export const money = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;

export const dateTime = (d: Date | string) =>
  new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" }).format(new Date(d));

export const ORDER_STATUS: Record<string, string> = {
  PENDING: "Pendiente",
  PAYMENT_PENDING: "Esperando pago",
  PAID: "Pagado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS: Record<string, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

export const CART_STATUS: Record<string, string> = {
  ACTIVE: "Activo",
  ABANDONED: "Abandonado",
  CONVERTED: "Convertido",
  EXPIRED: "Expirado",
};

/** Clase de color del badge según el estado. */
export function tone(status: string) {
  if (["PAID", "APPROVED", "DELIVERED", "CONVERTED", "SHIPPED"].includes(status)) return "is-ok";
  if (["CANCELLED", "REJECTED", "REFUNDED", "ABANDONED", "EXPIRED"].includes(status)) return "is-bad";
  return "is-wait";
}
