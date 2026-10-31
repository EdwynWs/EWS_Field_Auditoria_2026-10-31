import { pool } from "./db.js";
import { configuration } from "./security.js";
import { createApp } from "./app.js";
const config = configuration();
const server = createApp(pool, config).listen(
  Number(process.env.PORT || 4000),
  "0.0.0.0",
  () =>
    console.log(
      JSON.stringify({
        event: "listening",
        port: Number(process.env.PORT || 4000),
      }),
    ),
);
server.requestTimeout = 30000;
server.headersTimeout = 15000;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
