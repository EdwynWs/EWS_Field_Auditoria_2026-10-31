import { randomUUID, createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
export const fail = (status, message) =>
  Object.assign(new Error(message), { status });
export const uuid = z.string().uuid();
export const text = (max, min = 0) => z.string().trim().min(min).max(max);
export const email = text(180, 3)
  .email()
  .transform((x) => x.toLowerCase());
export const password = z
  .string()
  .min(12)
  .max(72)
  .refine(
    (x) => Buffer.byteLength(x, "utf8") <= 72,
    "Senha deve ter no máximo 72 bytes.",
  );
export const parse = (schema, input) => {
  const r = schema.safeParse(input);
  if (!r.success)
    throw fail(400, "Dados inválidos. Confira os campos, limites e formato.");
  return r.data;
};
export const manager = (req, res, next) =>
  req.user.role === "manager"
    ? next()
    : next(fail(403, "Acesso exclusivo do gestor"));
export function configuration(env = process.env) {
  if (
    !env.DATABASE_URL ||
    !env.JWT_SECRET ||
    env.JWT_SECRET.length < 32 ||
    /^(change|replace|troque)/i.test(env.JWT_SECRET)
  )
    throw Error(
      "Configure DATABASE_URL e JWT_SECRET aleatório (32+ caracteres).",
    );
  const origins = (env.WEB_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((x) => x.trim());
  if (
    env.NODE_ENV === "production" &&
    (!env.WEB_ORIGIN ||
      origins.some((x) => !x.startsWith("https://") || new URL(x).origin !== x))
  )
    throw Error("WEB_ORIGIN deve conter origens HTTPS explícitas.");
  return {
    secret: env.JWT_SECRET,
    origins,
    production: env.NODE_ENV === "production",
    allowSignup: env.ALLOW_PUBLIC_SIGNUP === "true",
    mediaDir: env.MEDIA_DIR || "./private-media",
    trustProxy: env.TRUST_PROXY
      ? env.TRUST_PROXY.split(",").map((x) => x.trim())
      : false,
  };
}
export function sessionSecurity(db, config) {
  async function issue(c, u) {
    const sid = randomUUID();
    await c.query(
      "INSERT INTO sessions(id,company_id,user_id,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",
      [sid, u.company_id, u.id],
    );
    return jwt.sign({}, config.secret, {
      algorithm: "HS256",
      subject: u.id,
      jwtid: sid,
      issuer: "ews-field",
      audience: "ews-field-client",
      expiresIn: "1h",
    });
  }
  const auth = wrap(async (req, res, next) => {
    let claims;
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ") || header.length > 4096) throw Error();
      claims = jwt.verify(header.slice(7), config.secret, {
        algorithms: ["HS256"],
        issuer: "ews-field",
        audience: "ews-field-client",
      });
      uuid.parse(claims.sub);
      uuid.parse(claims.jti);
    } catch {
      throw fail(401, "Sessão inválida ou expirada. Entre novamente.");
    }
    const q = await db.query(
      `SELECT u.id,u.company_id,u.role,u.name,u.email FROM sessions s JOIN users u ON u.id=s.user_id AND u.company_id=s.company_id JOIN companies c ON c.id=u.company_id WHERE s.id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.active AND c.active`,
      [claims.jti, claims.sub],
    );
    if (!q.rowCount)
      throw fail(401, "Sessão inválida ou expirada. Entre novamente.");
    req.user = { ...q.rows[0], companyId: q.rows[0].company_id };
    req.sessionId = claims.jti;
    next();
  });
  return { issue, auth };
}
export function limiter(
  db,
  secret,
  scope,
  limit,
  windowSeconds,
  identity = (req) => req.ip,
) {
  return wrap(async (req, res, next) => {
    const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = createHmac("sha256", secret)
      .update(`${scope}:${identity(req)}:${bucket}`)
      .digest("hex");
    const q = await db.query(
      `INSERT INTO rate_buckets(key,hits,expires_at) VALUES($1,1,to_timestamp($2)) ON CONFLICT(key) DO UPDATE SET hits=rate_buckets.hits+1 RETURNING hits`,
      [key, (bucket + 1) * windowSeconds],
    );
    if (q.rows[0].hits > limit) {
      res.set("Retry-After", String(windowSeconds));
      throw fail(429, "Muitas tentativas. Aguarde e tente novamente.");
    }
    next();
  });
}
export async function audit(c, req, action, resourceId = null) {
  await c.query(
    "INSERT INTO audit_events(company_id,actor_id,action,resource_id,request_id) VALUES($1,$2,$3,$4,$5)",
    [
      req.user?.companyId || null,
      req.user?.id || null,
      action,
      resourceId,
      req.id,
    ],
  );
}
export function pagination(req) {
  return parse(
    z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
      offset: z.coerce.number().int().min(0).max(1000000).default(0),
    }),
    req.query,
  );
}
export function sendPage(res, rows, { limit, offset }) {
  if (rows.length > limit) res.set("X-Next-Offset", String(offset + limit));
  return res.json(rows.slice(0, limit));
}
