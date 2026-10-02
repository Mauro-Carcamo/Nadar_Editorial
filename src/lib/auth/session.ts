// Sesión del panel de administración: token firmado con HMAC-SHA256 (Web Crypto, sirve en proxy y en servidor).
// Formato: base64url(payload JSON).base64url(firma). Se guarda en una cookie httpOnly.
// Al migrar a Supabase Auth este módulo se reemplaza por la sesión de Supabase.

export const ADMIN_COOKIE = "nadar_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 horas

export const ADMIN_ROLES = ["admin", "super_admin", "editor", "sales", "inventory_manager"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminSession = {
  sub: string; // id de app_users
  email: string;
  name: string | null;
  role: AdminRole;
  exp: number; // segundos epoch
};

const encoder = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(text: string) {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET falta o es muy corto (mínimo 32 caracteres)");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createSessionToken(data: Omit<AdminSession, "exp">) {
  const payload: AdminSession = { ...data, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const body = b64url(encoder.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body)));
  return `${body}.${b64url(sig)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await getKey(), fromB64url(sig), encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as AdminSession;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!ADMIN_ROLES.includes(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}
