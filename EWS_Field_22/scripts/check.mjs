import { spawnSync } from "node:child_process";
for (const [cmd, args] of [
  [process.execPath, ["node_modules/eslint/bin/eslint.js", "."]],
  [
    process.execPath,
    [
      "node_modules/prettier/bin/prettier.cjs",
      "--check",
      "backend/src",
      "backend/test",
      "scripts",
      "web/lib",
      "web/app/api",
      "mobile/config.js",
      "mobile/session.js",
      "mobile/app.config.js",
      "mobile/eas.json",
      ".github/workflows",
    ],
  ],
]) {
  const r = spawnSync(cmd, args, { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status || 1);
}
