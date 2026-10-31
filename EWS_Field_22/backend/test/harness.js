import pg from "pg";
import { randomUUID } from "node:crypto";
export async function testDatabase() {
  if (process.env.TEST_PGLITE === "true") {
    const { PGlite } = await import("@electric-sql/pglite");
    const p = new PGlite();
    let tail = Promise.resolve();
    async function connect() {
      let release;
      const prior = tail;
      tail = new Promise((r) => (release = r));
      await prior;
      return {
        query: async (sql, args) => {
          if (!args && sql.includes(";")) {
            const result = await p.exec(sql);
            const last = result.at(-1) || {};
            return {
              ...last,
              rowCount: last.rows?.length || last.affectedRows || 0,
            };
          }
          const r = await p.query(sql, args);
          return { ...r, rowCount: r.rows?.length || r.affectedRows || 0 };
        },
        release,
      };
    }
    return {
      async query(sql, args) {
        const c = await connect();
        try {
          return await c.query(sql, args);
        } finally {
          c.release();
        }
      },
      connect,
      end: () => p.close(),
      cleanup: async () => {},
      kind: "PostgreSQL WASM (PGlite), serialized connections",
    };
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw Error(
      "Set TEST_DATABASE_URL to a disposable database ending in _test.",
    );
  const admin = new pg.Pool({ connectionString: url });
  const schema = "test_" + randomUUID().replaceAll("-", "");
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = new pg.Pool({
    connectionString: url,
    options: `-c search_path=${schema},public`,
  });
  db.cleanup = async () => {
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  };
  db.kind = "PostgreSQL server";
  return db;
}
