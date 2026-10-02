import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CartLineSchema, SHIPPING_ZONE_CODES } from "@/schemas/checkout";
import { syncGuestCart } from "@/services/cart/cart-service";

const CartSyncSchema = z.object({
  token: z.string().min(16).max(100),
  items: z.array(CartLineSchema).max(50),
  shippingZone: z.enum(SHIPPING_ZONE_CODES).nullable().optional(),
});

// Persistencia del carrito: el cliente envía su contenido (con debounce) y recibe precios y stock reales.
export async function PUT(request: NextRequest) {
  if (!rateLimit(`cart:${clientIp(request)}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED" } }, { status: 429 });
  }
  const parsed = CartSyncSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR" } }, { status: 400 });
  }
  try {
    const result = await syncGuestCart(parsed.data.token, parsed.data.items, parsed.data.shippingZone ?? null);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cart]", error);
    return NextResponse.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}
