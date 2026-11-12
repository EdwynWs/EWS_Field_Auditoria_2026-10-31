import "dotenv/config";
import { pool } from "../backend/src/db.js";
import { issueRecovery } from "../backend/src/recovery.js";
try {
  const [email, origin, confirmed] = process.argv.slice(2);
  const url = new URL(origin);
  if (
    confirmed !== "--identity-verified" ||
    !email ||
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  )
    throw Error(
      "Uso: node scripts/issue-recovery.mjs email https://SEU-DOMINIO --identity-verified (após verificar identidade).",
    );
  const token = await issueRecovery(pool, email);
  // Fragment avoids putting the recovery credential in HTTP access logs/referrers.
  console.log(`${url.origin}/recuperar#${token}`);
} catch (e) {
  console.error(
    e.code ? "Falha na recuperação. Verifique banco e migrações." : e.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
