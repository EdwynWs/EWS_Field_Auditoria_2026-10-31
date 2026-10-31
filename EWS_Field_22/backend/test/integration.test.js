import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { testDatabase } from "./harness.js";
import { migrate } from "../src/migrate.js";
import { createApp } from "../src/app.js";
import { limiter, configuration } from "../src/security.js";
import express from "express";
let db,
  server,
  base,
  dir,
  photo,
  A,
  B,
  ta,
  tb,
  t2,
  ca,
  cb,
  oa,
  ob,
  logs = [];
const secret = "test-only-" + randomUUID() + randomUUID();
const pass = "Testing-only-Password42!";
async function call(route, { token, method = "GET", body, key, raw } = {}) {
  const r = await fetch(base + route, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined || raw
        ? { "Content-Type": "application/json" }
        : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
  const type = r.headers.get("content-type") || "";
  return {
    status: r.status,
    headers: r.headers,
    data: type.includes("json")
      ? await r.json()
      : Buffer.from(await r.arrayBuffer()),
  };
}
async function ok(route, options, status = 200) {
  const r = await call(route, options);
  assert.equal(r.status, status, `${route}: ${JSON.stringify(r.data)}`);
  return r.data;
}
async function user(owner, name, role = "technician") {
  const u = await ok(
    "/users",
    {
      token: owner.token,
      method: "POST",
      body: { name, email: `${name}@example.test`, password: pass, role },
    },
    201,
  );
  const login = await ok("/auth/login", {
    method: "POST",
    body: { email: u.email, password: pass },
  });
  return { ...login, id: u.id };
}
async function newOrder(token, customer, technician) {
  return ok(
    "/orders",
    {
      token,
      method: "POST",
      body: {
        title: "Atendimento de teste",
        customer_id: customer.id,
        technician_id: technician?.id || null,
      },
    },
    201,
  );
}
const visit = (kind = "checkin") => ({
  kind,
  latitude: -22,
  longitude: -50,
  accuracy: 5,
  photo_data: photo,
});
before(async () => {
  db = await testDatabase();
  dir = await mkdtemp(path.join(os.tmpdir(), "ews-media-"));
  await migrate(db);
  await migrate(db);
  const config = {
    secret,
    origins: ["http://localhost:3000"],
    trustProxy: false,
    allowSignup: true,
    mediaDir: dir,
  };
  server = createApp(db, config, { logger: (e) => logs.push(e) }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
  photo =
    "data:image/jpeg;base64," +
    (
      await sharp({
        create: { width: 20, height: 20, channels: 3, background: "#123456" },
      })
        .jpeg()
        .toBuffer()
    ).toString("base64");
  A = await ok(
    "/auth/register",
    {
      method: "POST",
      body: {
        company: "Empresa A",
        name: "Gestor A",
        email: "a@example.test",
        password: pass,
      },
    },
    201,
  );
  B = await ok(
    "/auth/register",
    {
      method: "POST",
      body: {
        company: "Empresa B",
        name: "Gestor B",
        email: "b@example.test",
        password: pass,
      },
    },
    201,
  );
  ta = await user(A, "tecnico_a");
  t2 = await user(A, "outro_a");
  tb = await user(B, "tecnico_b");
  ca = await ok(
    "/customers",
    { token: A.token, method: "POST", body: { name: "Cliente A" } },
    201,
  );
  cb = await ok(
    "/customers",
    { token: B.token, method: "POST", body: { name: "Cliente B" } },
    201,
  );
  oa = await newOrder(A.token, ca, ta);
  ob = await newOrder(B.token, cb, tb);
  console.log("Integration engine: " + db.kind);
});
after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) {
    await db.end();
    await db.cleanup();
  }
  if (dir) await rm(dir, { recursive: true, force: true });
});
test("health and readiness", async () => {
  assert.equal((await call("/health")).status, 200);
  assert.equal((await call("/ready")).status, 200);
});
test("missing, malformed, expired and wrong-audience JWT rejected", async () => {
  for (const token of [undefined, "bad"])
    assert.equal((await call("/orders", { token })).status, 401);
  for (const options of [
    { expiresIn: -1, audience: "ews-field-client" },
    { expiresIn: 3600, audience: "other" },
  ]) {
    const token = jwt.sign({}, secret, {
      subject: ta.id,
      jwtid: randomUUID(),
      issuer: "ews-field",
      ...options,
    });
    assert.equal((await call("/orders", { token })).status, 401);
  }
});
test("company isolation in lists, customers, users, dashboard", async () => {
  const orders = await ok("/orders", { token: A.token });
  assert.deepEqual(
    orders.map((x) => x.id),
    [oa.id],
  );
  assert.deepEqual(
    (await ok("/customers", { token: A.token })).map((x) => x.id),
    [ca.id],
  );
  assert.ok(
    (await ok("/users", { token: A.token })).every(
      (x) => x.email !== "b@example.test",
    ),
  );
  assert.equal((await ok("/dashboard", { token: A.token })).total, 1);
});
test("technician cannot access manager functions or peer orders", async () => {
  for (const route of ["/users", "/customers", "/orders"])
    assert.equal(
      (await call(route, { token: ta.token, method: "POST", body: {} })).status,
      403,
    );
  assert.equal((await call("/users", { token: ta.token })).status, 403);
  assert.deepEqual(await ok("/orders", { token: t2.token }), []);
  assert.deepEqual(await ok("/customers", { token: t2.token }), []);
});
test("cross-tenant foreign keys denied by API and database", async () => {
  assert.equal(
    (
      await call("/orders", {
        token: A.token,
        method: "POST",
        body: { title: "Bad order", customer_id: cb.id, technician_id: ta.id },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/orders", {
        token: A.token,
        method: "POST",
        body: { title: "Bad order", customer_id: ca.id, technician_id: tb.id },
      })
    ).status,
    400,
  );
  await assert.rejects(
    db.query(
      "INSERT INTO orders(company_id,customer_id,title) VALUES($1,$2,$3)",
      [A.user.company_id, cb.id, "cross tenant"],
    ),
    (e) => e.code === "23503",
  );
  await assert.rejects(
    db.query(
      "INSERT INTO reports(company_id,order_id,technician_id,notes) VALUES($1,$2,$3,$4)",
      [A.user.company_id, ob.id, ta.id, "cross tenant"],
    ),
    (e) => e.code === "23503",
  );
});
test("IDOR denied for status, visits, reports, assignment and media", async () => {
  for (const token of [B.token, t2.token]) {
    for (const suffix of [
      "visits",
      "reports",
      `media/${randomUUID()}`,
      `visits/${randomUUID()}/photo`,
      `reports/${randomUUID()}/photos/0`,
    ])
      assert.equal(
        (await call(`/orders/${oa.id}/${suffix}`, { token })).status,
        404,
      );
    assert.equal(
      (
        await call(`/orders/${oa.id}/status`, {
          token,
          method: "PATCH",
          body: { status: "completed" },
        })
      ).status,
      404,
    );
  }
  assert.equal(
    (
      await call(`/orders/${oa.id}/assignment`, {
        token: B.token,
        method: "PATCH",
        body: { technician_id: tb.id },
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/visits`, {
        token: tb.token,
        method: "POST",
        body: visit(),
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/reports`, {
        token: tb.token,
        method: "POST",
        body: { notes: "Cross tenant" },
      })
    ).status,
    404,
  );
});
test("tenant and role supplied by client cannot override server authority", async () => {
  assert.equal(
    (
      await call("/customers", {
        token: A.token,
        method: "POST",
        body: { name: "Invalid", company_id: B.user.company_id },
      })
    ).status,
    400,
  );
  const q = await ok("/me", { token: ta.token });
  assert.equal(q.role, "technician");
});
test("invalid UUID, SQL injection, invalid JSON and payload limits", async () => {
  assert.equal(
    (
      await call("/orders/not-a-uuid/status", {
        token: A.token,
        method: "PATCH",
        body: { status: "completed" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await call("/orders?offset=0;DROP%20TABLE%20orders", { token: A.token }))
      .status,
    400,
  );
  assert.equal(
    (await call("/customers", { token: A.token, method: "POST", raw: "{" }))
      .status,
    400,
  );
  assert.equal(
    (
      await call("/customers", {
        token: A.token,
        method: "POST",
        body: { name: "x".repeat(15 * 1024 * 1024) },
      })
    ).status,
    413,
  );
  const literal = await ok(
    "/customers",
    {
      token: A.token,
      method: "POST",
      body: { name: "<script>alert(1)</script>'; DROP TABLE users; --" },
    },
    201,
  );
  assert.match(literal.name, /<script>/);
  assert.equal((await ok("/me", { token: A.token })).id, A.user.id);
});
test("password length, UTF-8 bcrypt truncation and field bounds", async () => {
  for (const password of ["short", "é".repeat(40)])
    assert.equal(
      (
        await call("/users", {
          token: A.token,
          method: "POST",
          body: {
            name: "User",
            email: "bounded@example.test",
            password,
            role: "technician",
          },
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await call("/customers", {
        token: A.token,
        method: "POST",
        body: { name: "x".repeat(151) },
      })
    ).status,
    400,
  );
});
test("assignment after creation validates company and active technician", async () => {
  const o = await newOrder(A.token, ca, null);
  assert.equal(
    (
      await call(`/orders/${o.id}/assignment`, {
        token: A.token,
        method: "PATCH",
        body: { technician_id: tb.id },
      })
    ).status,
    400,
  );
  const assigned = await ok(`/orders/${o.id}/assignment`, {
    token: A.token,
    method: "PATCH",
    body: { technician_id: ta.id },
  });
  assert.equal(assigned.status, "assigned");
});
test("checkout without checkin, early completion and manual start rejected", async () => {
  assert.equal(
    (
      await call(`/orders/${oa.id}/visits`, {
        token: ta.token,
        method: "POST",
        body: visit("checkout"),
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/status`, {
        token: ta.token,
        method: "PATCH",
        body: { status: "completed" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/status`, {
        token: A.token,
        method: "PATCH",
        body: { status: "in_progress" },
      })
    ).status,
    409,
  );
});
test("uploads reject SVG, spoofed image, excessive resolution and poor GPS", async () => {
  for (const photo_data of [
    "data:image/svg+xml;base64,PHN2Zz4=",
    "data:image/jpeg;base64,aW52YWxpZA==",
  ])
    assert.equal(
      (
        await call(`/orders/${oa.id}/visits`, {
          token: ta.token,
          method: "POST",
          body: { ...visit(), photo_data },
        })
      ).status,
      400,
    );
  assert.equal(
    (
      await call(`/orders/${oa.id}/visits`, {
        token: ta.token,
        method: "POST",
        body: { ...visit(), accuracy: 200 },
      })
    ).status,
    400,
  );
  assert.equal((await readdir(dir)).length, 0);
});
test("concurrent duplicate checkins create exactly one visit", async () => {
  const results = await Promise.all(
    [1, 2].map(() =>
      call(`/orders/${oa.id}/visits`, {
        token: ta.token,
        method: "POST",
        body: visit(),
      }),
    ),
  );
  assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
  assert.equal(
    (await ok(`/orders/${oa.id}/visits`, { token: A.token })).length,
    1,
  );
});
test("image decoder rejects excessive pixels and reports reject more than five photos", async () => {
  const large =
    "data:image/png;base64," +
    (
      await sharp({
        create: { width: 5000, height: 5000, channels: 3, background: "#000" },
      })
        .png()
        .toBuffer()
    ).toString("base64");
  assert.equal(
    (
      await call(`/orders/${oa.id}/reports`, {
        token: ta.token,
        method: "POST",
        body: { notes: "Invalid dimensions", photos: [large] },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/reports`, {
        token: ta.token,
        method: "POST",
        body: { notes: "Too many photos", photos: Array(6).fill(photo) },
      })
    ).status,
    400,
  );
});
test("private photos require owning company or assigned technician; base64 not persisted", async () => {
  const v = (await ok(`/orders/${oa.id}/visits`, { token: A.token }))[0];
  assert.ok(v.photo_id);
  for (const token of [A.token, ta.token]) {
    const r = await call(`/orders/${oa.id}/media/${v.photo_id}`, { token });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("cache-control"), /no-store/);
    assert.equal((await sharp(r.data).metadata()).format, "jpeg");
  }
  assert.equal(
    (await call(`/orders/${oa.id}/media/${v.photo_id}`, { token: B.token }))
      .status,
    404,
  );
  assert.equal(
    (await call(`/orders/${oa.id}/media/${v.photo_id}`)).status,
    401,
  );
  assert.equal(
    (await db.query("SELECT photo_data FROM visits WHERE id=$1", [v.id]))
      .rows[0].photo_data,
    null,
  );
});
test("active visit blocks cancellation and reassignment", async () => {
  assert.equal(
    (
      await call(`/orders/${oa.id}/status`, {
        token: A.token,
        method: "PATCH",
        body: { status: "cancelled" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/assignment`, {
        token: A.token,
        method: "PATCH",
        body: { technician_id: t2.id },
      })
    ).status,
    409,
  );
});
test("idempotent checkout replay; changed payload with same key rejected", async () => {
  const key = randomUUID();
  const opts = {
    token: ta.token,
    method: "POST",
    body: visit("checkout"),
    key,
  };
  const [a, b] = await Promise.all([
    ok(`/orders/${oa.id}/visits`, opts, 201),
    ok(`/orders/${oa.id}/visits`, opts, 201),
  ]);
  assert.equal(a.id, b.id);
  assert.equal(
    (
      await call(`/orders/${oa.id}/visits`, {
        ...opts,
        body: { ...opts.body, latitude: 0 },
      })
    ).status,
    409,
  );
});
test("report idempotency, photo authorization, completion and immutable closed order", async () => {
  const opts = {
    token: ta.token,
    method: "POST",
    body: {
      notes: "Serviço realizado",
      checklist: [{ label: "Testado", done: true }],
      photos: [photo],
    },
    key: randomUUID(),
  };
  const first = await ok(`/orders/${oa.id}/reports`, opts, 201);
  assert.equal((await ok(`/orders/${oa.id}/reports`, opts, 201)).id, first.id);
  const reports = await ok(`/orders/${oa.id}/reports`, { token: A.token });
  assert.equal(reports.length, 1);
  assert.equal(reports[0].media_ids.length, 1);
  assert.equal(
    (
      await call(`/orders/${oa.id}/media/${reports[0].media_ids[0]}`, {
        token: t2.token,
      })
    ).status,
    404,
  );
  await ok(`/orders/${oa.id}/status`, {
    token: ta.token,
    method: "PATCH",
    body: { status: "completed" },
  });
  for (const status of ["open", "assigned", "cancelled"])
    assert.equal(
      (
        await call(`/orders/${oa.id}/status`, {
          token: A.token,
          method: "PATCH",
          body: { status },
        })
      ).status,
      409,
    );
  assert.equal(
    (
      await call(`/orders/${oa.id}/reports`, {
        token: ta.token,
        method: "POST",
        body: { notes: "After close" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(`/orders/${oa.id}/visits`, {
        token: ta.token,
        method: "POST",
        body: visit(),
      })
    ).status,
    409,
  );
});
test("manager can cancel an active visit with a reason, retaining evidence", async () => {
  const o = await newOrder(A.token, ca, ta);
  await ok(
    `/orders/${o.id}/visits`,
    { token: ta.token, method: "POST", body: visit() },
    201,
  );
  const result = await ok(`/orders/${o.id}/status`, {
    token: A.token,
    method: "PATCH",
    body: {
      status: "cancelled",
      reason: "Atendimento interrompido por solicitação do cliente.",
    },
  });
  assert.equal(result.status, "cancelled");
  assert.ok(result.cancellation_reason);
  assert.equal(
    (await ok(`/orders/${o.id}/visits`, { token: A.token })).length,
    1,
  );
});
test("pagination is bounded and deterministic", async () => {
  const first = await call("/orders?limit=1", { token: A.token });
  assert.equal(first.data.length, 1);
  assert.equal(first.headers.get("x-next-offset"), "1");
  const second = await ok("/orders?limit=1&offset=1", { token: A.token });
  assert.notEqual(second[0].id, first.data[0].id);
  assert.equal(
    (await call("/orders?limit=10000", { token: A.token })).status,
    400,
  );
});
test("marketing persists validated consent, ignores honeypot, rejects invalid email", async () => {
  const body = {
    name: "Lead Test",
    email: "lead@example.test",
    company: "Test",
    teamSize: "1–5 técnicos",
    consent: true,
  };
  await ok("/public/leads", { method: "POST", body }, 201);
  await ok(
    "/public/leads",
    { method: "POST", body: { ...body, website: "bot.test" } },
    201,
  );
  assert.equal(
    (
      await call("/public/leads", {
        method: "POST",
        body: { ...body, consent: false },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("/public/leads", {
        method: "POST",
        body: { ...body, email: "invalid" },
      })
    ).status,
    400,
  );
  assert.equal(
    (await db.query("SELECT count(*)::int AS n FROM marketing_leads")).rows[0]
      .n,
    1,
  );
});
test("logout revokes a token on all protected endpoints", async () => {
  await ok("/auth/logout", { token: t2.token, method: "POST", body: {} });
  for (const route of ["/me", "/orders", "/customers", "/dashboard"])
    assert.equal((await call(route, { token: t2.token })).status, 401);
});
test("deactivation revokes sessions and reactivation does not revive old tokens", async () => {
  await ok(`/users/${ta.id}/active`, {
    token: A.token,
    method: "PATCH",
    body: { active: false },
  });
  assert.equal((await call("/orders", { token: ta.token })).status, 401);
  await ok(`/users/${ta.id}/active`, {
    token: A.token,
    method: "PATCH",
    body: { active: true },
  });
  assert.equal((await call("/orders", { token: ta.token })).status, 401);
  assert.equal(
    (
      await call(`/users/${tb.id}/active`, {
        token: A.token,
        method: "PATCH",
        body: { active: false },
      })
    ).status,
    404,
  );
});
test("current role and company suspension are enforced on every request", async () => {
  await db.query("UPDATE users SET role='technician' WHERE id=$1", [B.user.id]);
  assert.equal((await call("/users", { token: B.token })).status, 403);
  await db.query("UPDATE companies SET active=false WHERE id=$1", [
    B.user.company_id,
  ]);
  assert.equal((await call("/orders", { token: tb.token })).status, 401);
});
test("password change revokes all sessions and old password fails", async () => {
  const other = await ok("/auth/login", {
    method: "POST",
    body: { email: "a@example.test", password: pass },
  });
  await ok("/auth/password", {
    token: A.token,
    method: "POST",
    body: { current_password: pass, new_password: "New-testing-password42!" },
  });
  assert.equal((await call("/me", { token: other.token })).status, 401);
  assert.equal((await call("/me", { token: A.token })).status, 401);
  assert.equal(
    (
      await call("/auth/login", {
        method: "POST",
        body: { email: "a@example.test", password: pass },
      })
    ).status,
    401,
  );
});
test("shared database rate limiter emits 429", async () => {
  const app = express();
  app.use(limiter(db, secret, "test", 2, 900));
  app.get("/", (_, r) => r.json({ ok: true }));
  app.use((e, req, res, next) =>
    res.status(e.status || 500).json({ error: "limited" }),
  );
  const srv = app.listen(0, "127.0.0.1");
  await new Promise((r) => srv.once("listening", r));
  try {
    const url = `http://127.0.0.1:${srv.address().port}`;
    assert.equal((await fetch(url)).status, 200);
    assert.equal((await fetch(url)).status, 200);
    const r = await fetch(url);
    assert.equal(r.status, 429);
    assert.ok(r.headers.get("retry-after"));
  } finally {
    await new Promise((r) => srv.close(r));
  }
});
test("logs exclude PII, passwords, JWTs, coordinates and request bodies", () => {
  const all = JSON.stringify(logs);
  for (const sensitive of [
    pass,
    A.token,
    "a@example.test",
    "photo_data",
    "latitude",
    "Serviço realizado",
  ])
    assert.ok(!all.includes(sensitive));
  assert.ok(logs.some((x) => x.request_id && x.status === 401));
});
test("production config fails closed without HTTPS and strong secret", () => {
  assert.throws(() =>
    configuration({ DATABASE_URL: "postgres://test", JWT_SECRET: "short" }),
  );
  assert.throws(() =>
    configuration({
      DATABASE_URL: "postgres://test",
      JWT_SECRET: secret,
      NODE_ENV: "production",
      WEB_ORIGIN: "http://localhost:3000",
    }),
  );
});
