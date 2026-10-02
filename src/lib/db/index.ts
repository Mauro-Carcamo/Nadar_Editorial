import { Pool, type PoolClient, type QueryResultRow } from "pg";

// Conexión única a PostgreSQL (solo servidor). En desarrollo se reutiliza entre recargas en caliente.
const globalForDb = globalThis as unknown as { nadarPool?: Pool };

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está configurada (ver .env.local)");
  }
  if (!globalForDb.nadarPool) {
    globalForDb.nadarPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  }
  return globalForDb.nadarPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params);
}

/** Ejecuta fn dentro de una transacción; hace ROLLBACK si lanza error. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export type { PoolClient };
