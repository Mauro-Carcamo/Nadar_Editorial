import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

// Límite de frecuencia por clave (en memoria, por instancia). Suficiente en local; en producción
// con varias instancias conviene un almacén compartido (Redis / Supabase).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}

export function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** IP anonimizada para guardar: no se almacena la IP en claro. */
export function hashIp(ip: string) {
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
}
