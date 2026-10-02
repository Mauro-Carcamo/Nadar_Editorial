import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, query } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Eventos de navegación → analytics_events (base del embudo analytics.fact_funnel_daily).
// Sin datos personales: solo un id de sesión aleatorio del navegador.

const EVENT_TYPES = ["page_view", "book_view", "add_to_cart", "cart_open", "checkout_start", "social_click"] as const;

const EventSchema = z.object({
  sessionId: z.string().regex(/^sess_[a-z0-9_]{6,60}$/i),
  eventType: z.enum(EVENT_TYPES),
  pagePath: z.string().startsWith("/").max(300),
  buttonId: z.string().max(80).optional(),
  meta: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: NextRequest) {
  if (!rateLimit(`events:${clientIp(request)}`, 120, 60 * 1000)) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Demasiados eventos" } }, { status: 429 });
  }
  const raw = await request.text();
  if (raw.length > 4000) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Evento demasiado grande" } }, { status: 413 });
  }
  let json: unknown = null;
  try {
    json = JSON.parse(raw);
  } catch {
    // se informa abajo como error de validación
  }
  const parsed = EventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Evento inválido" } }, { status: 400 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true });

  const { sessionId, eventType, pagePath, buttonId, meta } = parsed.data;
  const slug = typeof meta?.slug === "string" ? meta.slug : pagePath.match(/^\/libros\/([^/?#]+)/)?.[1] ?? null;
  await query(
    `INSERT INTO analytics_events (session_id, event_type, page_path, button_id, book_id, meta)
     VALUES ($1, $2, $3, $4, (SELECT id FROM books WHERE slug = $5), $6)`,
    [sessionId, eventType, pagePath, buttonId ?? null, slug, JSON.stringify(meta ?? {})],
  );
  return NextResponse.json({ ok: true });
}
