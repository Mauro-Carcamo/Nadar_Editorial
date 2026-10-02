import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/checkout/ClearCartOnSuccess";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { query } from "@/lib/db";

export const metadata: Metadata = { title: "Resultado del pago | Nadar Ediciones", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (n: number) => `$${new Intl.NumberFormat("es-CL").format(n)}`;
const UUID = /^[0-9a-f-]{36}$/i;

export default async function CheckoutResultPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams;
  // El estado se lee de la base de datos, nunca del parámetro de la URL
  const order =
    pedido && UUID.test(pedido)
      ? (
          await query<{ order_number: number; status: string; total: number; email: string; payment_status: string | null }>(
            `SELECT o.order_number, o.status, o.total, o.email,
                    (SELECT p.status FROM payments p WHERE p.order_id = o.id ORDER BY p.updated_at DESC LIMIT 1) AS payment_status
             FROM orders o WHERE o.id = $1`,
            [pedido],
          )
        ).rows[0]
      : undefined;

  const paid = order && ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status);

  return (
    <>
      <SiteHeader />
      <main className="checkout-page">
        <div className="container checkout-result">
          {paid ? (
            <>
              <ClearCartOnSuccess />
              <p className="home-hero-eyebrow">Pago aprobado</p>
              <h1 className="home-collections-heading">¡Gracias por tu compra!</h1>
              <p>
                Tu pedido <strong>#{order.order_number}</strong> por <strong>{fmt(order.total)}</strong> quedó confirmado. Te
                escribiremos a <strong>{order.email}</strong> con los detalles de la entrega.
              </p>
            </>
          ) : order ? (
            <>
              <p className="home-hero-eyebrow">Pago no completado</p>
              <h1 className="home-collections-heading">No pudimos confirmar el pago</h1>
              <p>
                El pedido <strong>#{order.order_number}</strong> quedó {order.status === "CANCELLED" ? "cancelado" : "pendiente"}.
                No se realizó ningún cargo. Tu carrito sigue guardado para que intentes nuevamente.
              </p>
              <Link href="/checkout" className="btn btn-primary">
                Volver a intentar
              </Link>
            </>
          ) : (
            <>
              <h1 className="home-collections-heading">Pedido no encontrado</h1>
              <Link href="/" className="btn btn-outline">
                Volver al inicio
              </Link>
            </>
          )}
          <Link href="/libros" className="text-link">
            Seguir explorando el catálogo
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
