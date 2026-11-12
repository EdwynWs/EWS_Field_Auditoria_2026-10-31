import { createHash, randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { transaction } from "./db.js";
import { audit, fail, parse, password, wrap, limiter } from "./security.js";
export const tokenHash = (token) =>
  createHash("sha256").update(token).digest("hex");
// Operator-only issuance; identity must be verified through the agreed support channel.
export async function issueRecovery(db, email) {
  return transaction(db, async (c) => {
    const q = await c.query(
      "SELECT u.id,u.company_id FROM users u JOIN companies c ON c.id=u.company_id WHERE lower(trim(u.email))=$1 AND u.active AND c.active FOR UPDATE OF u",
      [email.trim().toLowerCase()],
    );
    if (!q.rowCount) throw Error("Conta ativa não encontrada.");
    const u = q.rows[0];
    await c.query(
      "DELETE FROM password_reset_tokens WHERE user_id=$1 AND company_id=$2",
      [u.id, u.company_id],
    );
    const token = randomBytes(32).toString("hex");
    await c.query(
      "INSERT INTO password_reset_tokens(token_hash,company_id,user_id,expires_at) VALUES($1,$2,$3,now()+interval '15 minutes')",
      [tokenHash(token), u.company_id, u.id],
    );
    await audit(
      c,
      { user: { companyId: u.company_id }, id: randomUUID() },
      "user.recovery_issued",
      u.id,
    );
    return token;
  });
}
export function recoveryRoute(app, db, config) {
  app.post(
    "/auth/reset-password",
    limiter(db, config.secret, "recovery", 10, 900),
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            token: z.string().regex(/^[a-f0-9]{64}$/),
            new_password: password,
          })
          .strict(),
        req.body,
      );
      const hash = await bcrypt.hash(d.new_password, 12);
      await transaction(db, async (c) => {
        // Lock the user before reset rows, consistently with issuance and password changes.
        const q = await c.query(
          "SELECT u.id,u.company_id FROM users u JOIN companies c ON c.id=u.company_id WHERE u.id=(SELECT user_id FROM password_reset_tokens WHERE token_hash=$1) AND u.active AND c.active FOR UPDATE OF u",
          [tokenHash(d.token)],
        );
        if (!q.rowCount)
          throw fail(
            400,
            "Link inválido ou expirado. Solicite outro ao suporte.",
          );
        const u = q.rows[0];
        const reset = await c.query(
          "UPDATE password_reset_tokens SET used_at=now() WHERE token_hash=$1 AND user_id=$2 AND company_id=$3 AND used_at IS NULL AND expires_at>now() RETURNING user_id",
          [tokenHash(d.token), u.id, u.company_id],
        );
        if (!reset.rowCount)
          throw fail(
            400,
            "Link inválido ou expirado. Solicite outro ao suporte.",
          );
        await c.query(
          "UPDATE users SET password_hash=$1 WHERE id=$2 AND company_id=$3",
          [hash, u.id, u.company_id],
        );
        await c.query(
          "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND company_id=$2",
          [u.id, u.company_id],
        );
        await c.query(
          "DELETE FROM password_reset_tokens WHERE user_id=$1 AND company_id=$2",
          [u.id, u.company_id],
        );
        req.user = { ...u, companyId: u.company_id };
        await audit(c, req, "user.password_recovered", u.id);
      });
      res.json({ ok: true });
    }),
  );
}
