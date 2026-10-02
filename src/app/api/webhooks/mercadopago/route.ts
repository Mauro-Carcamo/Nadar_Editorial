import { NextResponse, type NextRequest } from "next/server";
import { mercadopagoProvider } from "@/services/payments/mercadopago";

// Webhook de Mercado Pago. Pendiente: validar la firma x-signature con MERCADOPAGO_WEBHOOK_SECRET,
// consultar el pago en la API (nunca confiar en el cuerpo) y aplicar el resultado con el mismo
// pipeline idempotente que Webpay (payment_events UNIQUE(provider, event_key)).
export async function POST(request: NextRequest) {
  if (!mercadopagoProvider.isConfigured()) {
    return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 501 });
  }
  void request;
  return NextResponse.json({ error: "Procesamiento de webhooks de Mercado Pago aún no implementado" }, { status: 501 });
}
