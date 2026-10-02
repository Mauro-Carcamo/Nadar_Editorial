import { NextResponse, type NextRequest } from "next/server";
import { confirmWebpay } from "@/services/payments/confirm";

// URL de retorno de Webpay (processCallback). Transbank vuelve por GET o POST con:
//   token_ws               → pago terminado (aprobado o rechazado): se confirma servidor a servidor
//   TBK_TOKEN (+ TBK_*)    → pago abortado por el cliente
// Después se redirige a la página de resultado del pedido.
async function handle(request: NextRequest, form?: FormData) {
  const get = (key: string) => (form?.get(key) as string | null) ?? request.nextUrl.searchParams.get(key);
  const outcome = await confirmWebpay({ tokenWs: get("token_ws"), tbkToken: get("TBK_TOKEN") });

  const target = new URL("/checkout/resultado", request.nextUrl.origin);
  if (outcome.orderId) target.searchParams.set("pedido", outcome.orderId);
  target.searchParams.set("estado", outcome.status);
  return NextResponse.redirect(target, 303);
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request, await request.formData());
}
