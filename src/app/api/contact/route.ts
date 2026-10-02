import { NextResponse, type NextRequest } from "next/server";
import { query } from "@/lib/db";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";
import { ContactSchema } from "@/schemas/contact";

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Enviaste varios mensajes seguidos. Intenta más tarde." } },
      { status: 429 },
    );
  }

  const parsed = ContactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Revisa los campos marcados", fieldErrors } },
      { status: 400 },
    );
  }
  const { name, email, subject, message } = parsed.data;

  await query("INSERT INTO contact_messages (name, email, subject, message, ip_hash) VALUES ($1, $2, $3, $4, $5)", [
    name,
    email,
    subject,
    message,
    hashIp(ip),
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
