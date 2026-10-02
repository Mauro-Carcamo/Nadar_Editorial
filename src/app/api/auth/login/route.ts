import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { ADMIN_COOKIE, ADMIN_ROLES, type AdminRole, SESSION_TTL_SECONDS, createSessionToken } from "@/lib/auth/session";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

// Límite simple de intentos por IP (en memoria; en producción usar un almacén compartido)
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.until > now && entry.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  const parsed = LoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Correo o clave inválidos." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const { rows } = await query<{
    id: string;
    email: string;
    display_name: string | null;
    password_hash: string;
    role: string;
    is_active: boolean;
  }>("SELECT id, email, display_name, password_hash, role, is_active FROM app_users WHERE email = $1", [email]);
  const user = rows[0];
  const ok =
    user && user.is_active && ADMIN_ROLES.includes(user.role as AdminRole) && verifyPassword(password, user.password_hash);

  if (!ok) {
    const current = entry && entry.until > now ? entry : { count: 0, until: now + WINDOW_MS };
    attempts.set(ip, { count: current.count + 1, until: current.until });
    await query(`INSERT INTO audit_log (user_id, action, entity, entity_id, metadata, ip) VALUES ($1, 'LOGIN_FAILED', 'USER', $2, $3, $4)`, [
      user?.id ?? null,
      user?.id ?? null,
      JSON.stringify({ email }),
      ip,
    ]);
    // Mismo mensaje para usuario inexistente y clave incorrecta
    return NextResponse.json({ error: "Correo o clave incorrectos." }, { status: 401 });
  }

  attempts.delete(ip);
  await query("UPDATE app_users SET last_login_at = now() WHERE id = $1", [user.id]);
  await query(`INSERT INTO audit_log (user_id, action, entity, entity_id, ip) VALUES ($1, 'LOGIN', 'USER', $2, $3)`, [
    user.id,
    user.id,
    ip,
  ]);

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.display_name,
    role: user.role as AdminRole,
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
