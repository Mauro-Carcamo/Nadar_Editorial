// Crea (o actualiza la clave de) un usuario administrador.
//   npm run db:create-admin -- correo@dominio.cl "Clave segura" "Nombre"
// Sin argumentos usa ADMIN_EMAIL / ADMIN_PASSWORD de .env.local.
// La clave se guarda con scrypt (mismo formato que src/lib/auth/password.ts).
import crypto from "node:crypto";
import pg from "pg";

const [emailArg, passwordArg, nameArg] = process.argv.slice(2);
const email = (emailArg || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = passwordArg || process.env.ADMIN_PASSWORD || "";
const name = nameArg || "Administración Nadar";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}
if (!email || password.length < 10) {
  console.error("Indica correo y una clave de al menos 10 caracteres.");
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
const hash = `scrypt$16384$8$1$${salt.toString("base64")}$${key.toString("base64")}`;

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rows } = await client.query(
    `INSERT INTO app_users (email, display_name, password_hash, role)
     VALUES ($1, $2, $3, 'super_admin')
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, is_active = true
     RETURNING id, (xmax = 0) AS inserted`,
    [email, name, hash],
  );
  await client.query(
    `INSERT INTO audit_log (user_id, action, entity, entity_id, metadata) VALUES ($1, $2, 'USER', $3, $4)`,
    [rows[0].id, rows[0].inserted ? "CREATED" : "PASSWORD_RESET", String(rows[0].id), JSON.stringify({ via: "cli", role: "super_admin" })],
  );
  console.log(`${rows[0].inserted ? "Administrador creado" : "Clave actualizada"}: ${email}`);
} finally {
  await client.end();
}
