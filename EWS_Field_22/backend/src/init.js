import { migrate } from "./migrate.js";
import { pool } from "./db.js";
try {
  await migrate();
  console.log("Banco inicializado e migrado.");
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
