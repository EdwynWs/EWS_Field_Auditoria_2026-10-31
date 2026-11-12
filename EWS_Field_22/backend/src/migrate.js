import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { pool } from "./db.js";
export async function migrate(db = pool) {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(840221)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const [name, file] of [
      ["001_base", "../sql/schema.sql"],
      ["002_security", "../sql/migrations/002_security.sql"],
      ["003_password_recovery", "../sql/migrations/003_password_recovery.sql"],
    ]) {
      const sql = await readFile(new URL(file, import.meta.url), "utf8");
      const hash = createHash("sha256").update(sql).digest("hex");
      const prior = await c.query(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (prior.rowCount) {
        if (prior.rows[0].checksum !== hash)
          throw Error(`Migration alterada: ${name}`);
      } else {
        await c.query(sql);
        await c.query(
          "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
          [name, hash],
        );
      }
    }
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await migrate();
    console.log("Migrações aplicadas.");
  } catch (e) {
    console.error(
      JSON.stringify({
        event: "migration_failed",
        code: e.code || "MIGRATION_ERROR",
      }),
    );
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
