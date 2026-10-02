import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, type AdminSession, verifySessionToken } from "@/lib/auth/session";

/** Sesión de admin actual (o null). Para Server Components, Server Actions y Route Handlers. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

/** Páginas del panel: redirige al login si no hay sesión válida. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Route Handlers: segunda verificación en el servidor (además del proxy).
 * Devuelve la sesión o una respuesta 401 lista para retornar.
 */
export async function requireAdminApi(): Promise<{ session: AdminSession } | { response: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return { response: NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sesión requerida" } }, { status: 401 }) };
  }
  return { session };
}
