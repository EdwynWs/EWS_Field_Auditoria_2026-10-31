import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { hashes, backup } from "../../scripts/backup.mjs";

test("backup hashes file streams and rejects symlink traversal", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "ews-hashes-"));
  try {
    await mkdir(path.join(root, "media"));
    const bytes = Buffer.alloc(2 * 1024 * 1024, 42);
    await writeFile(path.join(root, "media", "fixture.jpg"), bytes);
    assert.equal(
      (await hashes(root))[path.join("media", "fixture.jpg")],
      createHash("sha256").update(bytes).digest("hex"),
    );
    if (process.platform !== "win32") {
      await symlink(path.join(root, "media"), path.join(root, "link"));
      await assert.rejects(hashes(root), /link simbólico/);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("backup refuses unpaused writes and recursive destinations before pg_dump", async () => {
  const prior = process.env.BACKUP_WRITES_PAUSED;
  const args = {
    url: "postgres://localhost/unused_test",
    mediaDir: path.resolve("private-media"),
    destination: path.resolve("private-media", "backup"),
  };
  try {
    delete process.env.BACKUP_WRITES_PAUSED;
    await assert.rejects(backup(args), /Pause escritas/);
    process.env.BACKUP_WRITES_PAUSED = "true";
    await assert.rejects(backup(args), /fora do diretório/);
  } finally {
    if (prior === undefined) delete process.env.BACKUP_WRITES_PAUSED;
    else process.env.BACKUP_WRITES_PAUSED = prior;
  }
});

test("backup CLI executes and fails explicitly when configuration is missing", () => {
  const script = fileURLToPath(
    new URL("../../scripts/backup.mjs", import.meta.url),
  );
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: "", MEDIA_DIR: "", BACKUP_DIR: "" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Configure DATABASE_URL/);
});
