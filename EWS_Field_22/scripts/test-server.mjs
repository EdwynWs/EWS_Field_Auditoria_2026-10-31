import { testDatabase } from "../backend/test/harness.js";
import { migrate } from "../backend/src/migrate.js";
import { createApp } from "../backend/src/app.js";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const db = await testDatabase();
await migrate(db);
const dir = await mkdtemp(path.join(os.tmpdir(), "ews-e2e-"));
const config = {
  secret: "test-server-" + crypto.randomUUID() + crypto.randomUUID(),
  origins: ["http://127.0.0.1:3000"],
  trustProxy: false,
  allowSignup: true,
  mediaDir: dir,
};
const server = createApp(db, config).listen(4000, "127.0.0.1");
for (const s of ["SIGINT", "SIGTERM"])
  process.on(s, () =>
    server.close(async () => {
      await db.end();
      await db.cleanup();
      await rm(dir, { recursive: true, force: true });
      process.exit(0);
    }),
  );
