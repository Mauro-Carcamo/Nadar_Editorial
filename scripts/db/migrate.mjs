// Aplica en orden las migraciones de db/migrations que aún no se ejecutaron.
// Cada migración corre en una transacción y queda registrada en schema_migrations.
//   npm run db:migrate
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const dir = path.resolve("db/migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
  const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));

  let applied = 0;
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    process.stdout.write(`Aplicando ${file}… `);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      applied += 1;
      console.log("ok");
    } catch (error) {
      await client.query("ROLLBACK");
      console.log("ERROR");
      throw error;
    }
  }
  console.log(applied ? `${applied} migración(es) aplicada(s).` : "La base ya estaba al día.");
} finally {
  await client.end();
}
