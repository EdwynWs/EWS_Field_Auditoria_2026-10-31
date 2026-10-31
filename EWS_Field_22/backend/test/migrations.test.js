import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { testDatabase } from "./harness.js";
import { migrate } from "../src/migrate.js";
const schema = await readFile(
  new URL("../sql/schema.sql", import.meta.url),
  "utf8",
);
test("migration keeps legacy records and base64 evidence, and is repeatable", async () => {
  const db = await testDatabase();
  try {
    await db.query(schema);
    const company = (
      await db.query(
        "INSERT INTO companies(name) VALUES('Legacy company') RETURNING id",
      )
    ).rows[0];
    const user = (
      await db.query(
        "INSERT INTO users(company_id,name,email,password_hash,role) VALUES($1,'Legacy user','legacy@example.test','synthetic hash','technician') RETURNING id",
        [company.id],
      )
    ).rows[0];
    const customer = (
      await db.query(
        "INSERT INTO customers(company_id,name) VALUES($1,'Legacy customer') RETURNING id",
        [company.id],
      )
    ).rows[0];
    const order = (
      await db.query(
        "INSERT INTO orders(company_id,customer_id,technician_id,title) VALUES($1,$2,$3,'Legacy order') RETURNING id",
        [company.id, customer.id, user.id],
      )
    ).rows[0];
    await db.query(
      "INSERT INTO visits(company_id,order_id,technician_id,kind,latitude,longitude,photo_data) VALUES($1,$2,$3,'checkin',0,0,'legacy value preserved')",
      [company.id, order.id, user.id],
    );
    await migrate(db);
    await migrate(db);
    assert.equal(
      (
        await db.query("SELECT photo_data FROM visits WHERE order_id=$1", [
          order.id,
        ])
      ).rows[0].photo_data,
      "legacy value preserved",
    );
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM orders")).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("SELECT active FROM companies WHERE id=$1", [company.id]))
        .rows[0].active,
      true,
    );
  } finally {
    await db.end();
    await db.cleanup();
  }
});
test("cross-tenant legacy corruption aborts migration without changing or deleting records", async () => {
  const db = await testDatabase();
  try {
    await db.query(schema);
    const a = (
      await db.query(
        "INSERT INTO companies(name) VALUES('Legacy A') RETURNING id",
      )
    ).rows[0];
    const b = (
      await db.query(
        "INSERT INTO companies(name) VALUES('Legacy B') RETURNING id",
      )
    ).rows[0];
    const customer = (
      await db.query(
        "INSERT INTO customers(company_id,name) VALUES($1,'Legacy customer') RETURNING id",
        [b.id],
      )
    ).rows[0];
    await db.query(
      "INSERT INTO orders(company_id,customer_id,title) VALUES($1,$2,'Invalid legacy reference')",
      [a.id, customer.id],
    );
    await assert.rejects(migrate(db), (e) => e.code === "23503");
    assert.equal(
      (await db.query("SELECT count(*)::int AS n FROM orders")).rows[0].n,
      1,
    );
    assert.equal(
      (await db.query("SELECT to_regclass('schema_migrations') AS table_name"))
        .rows[0].table_name,
      null,
    );
  } finally {
    await db.end();
    await db.cleanup();
  }
});
