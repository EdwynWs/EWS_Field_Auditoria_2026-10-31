import pg from "pg";
import { randomUUID } from "node:crypto";
import { mkdtemp, writeFile, readFile, rm, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { backup, runPg, hashes } from "./backup.mjs";
import { migrate } from "../backend/src/migrate.js";
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test"))
  throw Error("Use apenas TEST_DATABASE_URL com banco terminado em _test.");
const admin = new pg.Pool({ connectionString: url });
const suffix = randomUUID().replaceAll("-", "");
const sourceName = "backup_" + suffix + "_test",
  targetName = "restore_" + suffix + "_test";
const sourceUrl = new URL(url);
sourceUrl.pathname = "/" + sourceName;
const targetUrl = new URL(url);
targetUrl.pathname = "/" + targetName;
let source, target;
const temp = await mkdtemp(path.join(os.tmpdir(), "ews-restore-"));
try {
  await admin.query(`CREATE DATABASE ${sourceName}`);
  await admin.query(`CREATE DATABASE ${targetName}`);
  source = new pg.Pool({ connectionString: sourceUrl.href });
  target = new pg.Pool({ connectionString: targetUrl.href });
  await migrate(source);
  const company = (
    await source.query(
      "INSERT INTO companies(name) VALUES('Restore fixture') RETURNING id",
    )
  ).rows[0];
  const customer = (
    await source.query(
      "INSERT INTO customers(company_id,name) VALUES($1,'Restore client') RETURNING id",
      [company.id],
    )
  ).rows[0];
  const order = (
    await source.query(
      "INSERT INTO orders(company_id,customer_id,title) VALUES($1,$2,'Restore order') RETURNING id",
      [company.id, customer.id],
    )
  ).rows[0];
  const id = randomUUID(),
    bytes = Buffer.from("synthetic restore fixture; not customer data");
  await mkdir(path.join(temp, "media"));
  await writeFile(path.join(temp, "media", id + ".jpg"), bytes);
  await source.query(
    "INSERT INTO media(id,company_id,order_id,object_key,mime_type,size_bytes) VALUES($1,$2,$3,$1,'image/jpeg',$4)",
    [id, company.id, order.id, bytes.length],
  );
  process.env.BACKUP_WRITES_PAUSED = "true";
  const destination = path.join(temp, "snapshot");
  await backup({
    url: sourceUrl.href,
    mediaDir: path.join(temp, "media"),
    destination,
  });
  const manifest = JSON.parse(
    await readFile(path.join(destination, "manifest.json"), "utf8"),
  );
  const actual = await hashes(destination);
  for (const [key, value] of Object.entries(manifest.sha256))
    if (actual[key] !== value) throw Error("Checksum não corresponde.");
  runPg(
    "pg_restore",
    [
      "--exit-on-error",
      "--single-transaction",
      "--no-owner",
      "--no-acl",
      "--dbname",
      targetName,
      path.join(destination, "database.dump"),
    ],
    targetUrl.href,
  );
  const rows = await target.query(
    "SELECT object_key,size_bytes FROM media WHERE id=$1",
    [id],
  );
  if (rows.rowCount !== 1) throw Error("Registro não restaurado.");
  const restored = await readFile(
    path.join(destination, "media", rows.rows[0].object_key + ".jpg"),
  );
  if (
    createHash("sha256").update(restored).digest("hex") !==
    createHash("sha256").update(bytes).digest("hex")
  )
    throw Error("Foto não restaurada.");
  if (
    (await target.query("SELECT count(*)::int AS n FROM schema_migrations"))
      .rows[0].n !== 2
  )
    throw Error("Migrations ausentes.");
  console.log(
    "PASS: pg_dump + pg_restore, registros, constraints/migrations e checksum de arquivo privado.",
  );
} finally {
  if (source) await source.end();
  if (target) await target.end();
  await admin.query(`DROP DATABASE IF EXISTS ${sourceName}`);
  await admin.query(`DROP DATABASE IF EXISTS ${targetName}`);
  await admin.end();
  await rm(temp, { recursive: true, force: true });
}
