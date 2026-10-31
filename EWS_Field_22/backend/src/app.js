import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { transaction } from "./db.js";
import {
  wrap,
  fail,
  parse,
  uuid,
  text,
  email,
  password,
  manager,
  sessionSecurity,
  limiter,
  audit,
  pagination,
  sendPage,
} from "./security.js";
import { ordersRouter } from "./orders.js";
const credentials = z
  .object({ email, password: z.string().min(1).max(128) })
  .strict();
const publicUser = (u) => ({
  id: u.id,
  company_id: u.company_id,
  name: u.name,
  email: u.email,
  role: u.role,
});
const dummyHash = bcrypt.hashSync("constant-time-dummy-password", 12);
export function createApp(
  db,
  config,
  { logger = (entry) => console.log(JSON.stringify(entry)) } = {},
) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(helmet());
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.set({ "X-Request-Id": req.id, "Cache-Control": "no-store" });
    const started = Date.now();
    res.on("finish", () =>
      logger({
        event: "request",
        request_id: req.id,
        method: req.method,
        route: req.route?.path || "unmatched",
        status: res.statusCode,
        duration_ms: Date.now() - started,
      }),
    );
    next();
  });
  app.use(
    cors({
      origin: (origin, cb) =>
        cb(null, !origin || config.origins.includes(origin)),
      exposedHeaders: ["X-Next-Offset", "X-Request-Id"],
    }),
  );
  app.get("/health", (_, res) => res.json({ ok: true }));
  app.get(
    "/ready",
    wrap(async (_, res) => {
      const q = await db.query(
        "SELECT name FROM schema_migrations WHERE name='002_security'",
      );
      if (!q.rowCount) throw fail(503, "Migrações pendentes.");
      res.json({ ok: true });
    }),
  );
  app.use(limiter(db, config.secret, "edge", 600, 60));
  app.use(express.json({ limit: "14mb", strict: true }));
  const { auth, issue } = sessionSecurity(db, config);
  const authLimit = limiter(db, config.secret, "auth", 20, 900);
  app.post(
    "/auth/register",
    authLimit,
    wrap(async (req, res) => {
      if (!config.allowSignup)
        throw fail(
          403,
          "Cadastro público indisponível. Entre em contato com a EWS Tech.",
        );
      const d = parse(
        z
          .object({
            company: text(120, 2),
            name: text(120, 2),
            email,
            password,
          })
          .strict(),
        req.body,
      );
      const hash = await bcrypt.hash(d.password, 12);
      const result = await transaction(db, async (c) => {
        const company = await c.query(
          "INSERT INTO companies(name) VALUES($1) RETURNING id",
          [d.company],
        );
        const q = await c.query(
          "INSERT INTO users(company_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,'manager') RETURNING id,company_id,name,email,role",
          [company.rows[0].id, d.name, d.email, hash],
        );
        req.user = { ...q.rows[0], companyId: q.rows[0].company_id };
        await audit(c, req, "company.created", company.rows[0].id);
        return { token: await issue(c, q.rows[0]), user: q.rows[0] };
      });
      res.status(201).json(result);
    }),
  );
  app.post(
    "/auth/login",
    authLimit,
    limiter(db, config.secret, "account-login", 20, 900, (req) =>
      String(req.body?.email || "")
        .trim()
        .toLowerCase(),
    ),
    wrap(async (req, res) => {
      const d = parse(credentials, req.body);
      const q = await db.query(
        "SELECT u.* FROM users u JOIN companies c ON c.id=u.company_id WHERE lower(trim(u.email))=$1 AND u.active AND c.active",
        [d.email],
      );
      const u = q.rows[0];
      const matches = await bcrypt.compare(
        d.password,
        u?.password_hash || dummyHash,
      );
      if (!u || !matches) throw fail(401, "Credenciais inválidas.");
      const token = await transaction(db, async (c) => {
        const current = await c.query(
          "SELECT u.* FROM users u JOIN companies c ON c.id=u.company_id WHERE u.id=$1 AND u.active AND c.active AND u.password_hash=$2 FOR SHARE OF u,c",
          [u.id, u.password_hash],
        );
        if (!current.rowCount) throw fail(401, "Credenciais inválidas.");
        req.user = { ...u, companyId: u.company_id };
        await audit(c, req, "session.created");
        return issue(c, u);
      });
      res.json({ token, user: publicUser(u) });
    }),
  );
  app.post(
    "/public/leads",
    limiter(db, config.secret, "leads", 15, 900),
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            name: text(120, 2),
            email,
            company: text(150, 2),
            phone: text(30).optional().default(""),
            teamSize: z.enum([
              "1–5 técnicos",
              "6–15 técnicos",
              "16–50 técnicos",
              "Mais de 50 técnicos",
              "Ainda estou estruturando",
            ]),
            message: text(1500).optional().default(""),
            consent: z.literal(true),
            website: text(100).optional().default(""),
          })
          .strict(),
        req.body,
      );
      if (!d.website)
        await db.query(
          "INSERT INTO marketing_leads(name,email,company,phone,team_size,message,consent) VALUES($1,$2,$3,$4,$5,$6,true)",
          [d.name, d.email, d.company, d.phone, d.teamSize, d.message],
        );
      res.status(201).json({ ok: true });
    }),
  );
  app.use(
    auth,
    limiter(db, config.secret, "user", 300, 60, (req) => req.user.id),
  );
  app.get("/me", (req, res) => res.json(publicUser(req.user)));
  app.post(
    "/auth/logout",
    wrap(async (req, res) => {
      await transaction(db, async (c) => {
        await c.query(
          "UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2",
          [req.sessionId, req.user.id],
        );
        await audit(c, req, "session.revoked");
      });
      res.json({ ok: true });
    }),
  );
  app.post(
    "/auth/password",
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            current_password: z.string().min(1).max(128),
            new_password: password,
          })
          .strict(),
        req.body,
      );
      const newHash = await bcrypt.hash(d.new_password, 12);
      await transaction(db, async (c) => {
        const q = await c.query(
          "SELECT password_hash FROM users WHERE id=$1 AND company_id=$2 FOR UPDATE",
          [req.user.id, req.user.companyId],
        );
        if (
          !(await bcrypt.compare(d.current_password, q.rows[0].password_hash))
        )
          throw fail(401, "Senha atual inválida.");
        await c.query(
          "UPDATE users SET password_hash=$1 WHERE id=$2 AND company_id=$3",
          [newHash, req.user.id, req.user.companyId],
        );
        await c.query(
          "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND company_id=$2",
          [req.user.id, req.user.companyId],
        );
        await audit(c, req, "user.password_changed", req.user.id);
      });
      res.json({ ok: true });
    }),
  );
  app.get(
    "/dashboard",
    wrap(async (req, res) => {
      const technician = req.user.role === "technician";
      const args = technician
        ? [req.user.companyId, req.user.id]
        : [req.user.companyId];
      const q = await db.query(
        "SELECT status,count(*)::int AS total FROM orders WHERE company_id=$1" +
          (technician ? " AND technician_id=$2" : "") +
          " GROUP BY status",
        args,
      );
      res.json({
        byStatus: q.rows,
        total: q.rows.reduce((s, x) => s + x.total, 0),
      });
    }),
  );
  app.get(
    "/users",
    manager,
    wrap(async (req, res) => {
      const p = pagination(req);
      const q = await db.query(
        "SELECT id,name,email,role,active FROM users WHERE company_id=$1 ORDER BY name,id LIMIT $2 OFFSET $3",
        [req.user.companyId, p.limit + 1, p.offset],
      );
      sendPage(res, q.rows, p);
    }),
  );
  app.post(
    "/users",
    manager,
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            name: text(120, 2),
            email,
            password,
            role: z.enum(["manager", "technician"]),
          })
          .strict(),
        req.body,
      );
      const hash = await bcrypt.hash(d.password, 12);
      const result = await transaction(db, async (c) => {
        const q = await c.query(
          "INSERT INTO users(company_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,active",
          [req.user.companyId, d.name, d.email, hash, d.role],
        );
        await audit(c, req, "user.created", q.rows[0].id);
        return q.rows[0];
      });
      res.status(201).json(result);
    }),
  );
  app.patch(
    "/users/:id/active",
    manager,
    wrap(async (req, res) => {
      parse(uuid, req.params.id);
      const d = parse(z.object({ active: z.boolean() }).strict(), req.body);
      if (req.params.id === req.user.id)
        throw fail(409, "Não é possível desativar o próprio acesso.");
      await transaction(db, async (c) => {
        // Serialize company membership changes before locking individual users.
        await c.query("SELECT id FROM companies WHERE id=$1 FOR UPDATE", [
          req.user.companyId,
        ]);
        const q = await c.query(
          "UPDATE users SET active=$1 WHERE id=$2 AND company_id=$3 RETURNING id",
          [d.active, req.params.id, req.user.companyId],
        );
        if (!q.rowCount) throw fail(404, "Usuário não encontrado.");
        if (!d.active)
          await c.query(
            "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND company_id=$2",
            [req.params.id, req.user.companyId],
          );
        await audit(
          c,
          req,
          d.active ? "user.activated" : "user.deactivated",
          req.params.id,
        );
      });
      res.json({ ok: true });
    }),
  );
  app.get(
    "/customers",
    wrap(async (req, res) => {
      const p = pagination(req);
      const args = [req.user.companyId];
      let extra = "";
      if (req.user.role === "technician") {
        args.push(req.user.id);
        extra =
          " AND EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=c.id AND o.company_id=c.company_id AND o.technician_id=$2)";
      }
      args.push(p.limit + 1, p.offset);
      const q = await db.query(
        `SELECT c.* FROM customers c WHERE c.company_id=$1 ${extra} ORDER BY c.created_at DESC,c.id LIMIT $${args.length - 1} OFFSET $${args.length}`,
        args,
      );
      sendPage(res, q.rows, p);
    }),
  );
  app.post(
    "/customers",
    manager,
    wrap(async (req, res) => {
      const d = parse(
        z
          .object({
            name: text(150, 2),
            phone: text(40).optional(),
            address: text(220).optional(),
          })
          .strict(),
        req.body,
      );
      const result = await transaction(db, async (c) => {
        const q = await c.query(
          "INSERT INTO customers(company_id,name,phone,address) VALUES($1,$2,$3,$4) RETURNING *",
          [req.user.companyId, d.name, d.phone || null, d.address || null],
        );
        await audit(c, req, "customer.created", q.rows[0].id);
        return q.rows[0];
      });
      res.status(201).json(result);
    }),
  );
  app.use("/orders", ordersRouter(db, config));
  app.use((req, res) =>
    res.status(404).json({ error: "Rota não encontrada.", request_id: req.id }),
  );
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status =
      err.type === "entity.too.large"
        ? 413
        : err.type === "entity.parse.failed"
          ? 400
          : err.status ||
            (err.code === "23505"
              ? 409
              : ["23503", "23514", "22P02"].includes(err.code)
                ? 400
                : 500);
    if (status >= 500)
      logger({
        event: "request_error",
        request_id: req.id,
        code: /^[0-9A-Z]{5}$/.test(err.code || "") ? err.code : "INTERNAL",
      });
    res.status(status).json({
      error:
        status >= 500
          ? "Erro interno do servidor."
          : err.status
            ? err.message
            : status === 413
              ? "Solicitação muito grande."
              : status === 409
                ? "Não foi possível cadastrar esses dados."
                : "Dados inválidos.",
      request_id: req.id,
    });
  });
  return app;
}
