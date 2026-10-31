import { pool } from "../backend/src/db.js";
try {
  // Deliberately retains audit, customer, GPS and photos until a policy is approved.
  await pool.query("DELETE FROM rate_buckets WHERE expires_at < now()");
  await pool.query(
    "DELETE FROM sessions WHERE expires_at < now()-interval '7 days'",
  );
  console.log("Limpeza de limites e sessões expiradas concluída.");
} finally {
  await pool.end();
}
