import { NextResponse, type NextRequest } from "next/server";
import { CheckoutSchema } from "@/schemas/checkout";
import { CheckoutError, createCheckout } from "@/services/checkout/checkout-service";

export async function POST(request: NextRequest) {
  const parsed = CheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Revisa los datos del formulario", issues: parsed.error.issues } },
      { status: 400 },
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  try {
    const result = await createCheckout(parsed.data, siteUrl);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CheckoutError) {
      const status = error.code === "INVALID_CART" ? 409 : error.code === "PROVIDER_UNAVAILABLE" ? 503 : 502;
      return NextResponse.json({ error: { code: error.code, message: error.message, problems: error.problems } }, { status });
    }
    console.error("[checkout]", error);
    return NextResponse.json({ error: { code: "INTERNAL", message: "No se pudo crear el pedido" } }, { status: 500 });
  }
}
