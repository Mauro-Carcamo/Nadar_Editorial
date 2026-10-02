// Crea el usuario y la base de datos locales de la app (se ejecuta una sola vez).
// Necesita la conexión del superusuario solo durante esta ejecución; no se guarda en el proyecto:
//   PG_SUPERUSER_URL="postgres://postgres:CLAVE@localhost:5434/postgres" npm run db:setup
// Lee DATABASE_URL de .env.local para saber qué usuario/clave/base crear.
import pg from "pg";

const superUrl = process.env.PG_SUPERUSER_URL;
const appUrl = process.env.DATABASE_URL;
if (!superUrl || !appUrl) {
  console.error("Faltan PG_SUPERUSER_URL (variable temporal) y/o DATABASE_URL (.env.local).");
  process.exit(1);
}

const target = new URL(appUrl);
const dbName = target.pathname.replace(/^\//, "");
const user = decodeURIComponent(target.username);
const password = decodeURIComponent(target.password);
const ident = (s) => `"${s.replace(/"/g, '""')}"`;
const literal = (s) => `'${s.replace(/'/g, "''")}'`;

const admin = new pg.Client({ connectionString: superUrl });
await admin.connect();
try {
  const role = await admin.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [user]);
  if (role.rowCount) {
    await admin.query(`ALTER ROLE ${ident(user)} WITH LOGIN PASSWORD ${literal(password)}`);
    console.log(`Usuario ${user}: ya existía, clave actualizada.`);
  } else {
    await admin.query(`CREATE ROLE ${ident(user)} WITH LOGIN PASSWORD ${literal(password)}`);
    console.log(`Usuario ${user}: creado.`);
  }

  const db = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (db.rowCount) {
    console.log(`Base ${dbName}: ya existía.`);
  } else {
    await admin.query(`CREATE DATABASE ${ident(dbName)} OWNER ${ident(user)} ENCODING 'UTF8' TEMPLATE template0`);
    console.log(`Base ${dbName}: creada (dueño ${user}).`);
  }
} finally {
  await admin.end();
}

// pgcrypto requiere superusuario en algunas instalaciones: se instala aquí, en la base nueva
const inDb = new URL(superUrl);
inDb.pathname = `/${dbName}`;
const client = new pg.Client({ connectionString: inDb.toString() });
await client.connect();
try {
  await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await client.query(`GRANT ALL ON SCHEMA public TO ${ident(user)}`);
  console.log("Extensión pgcrypto lista.");
} finally {
  await client.end();
}
