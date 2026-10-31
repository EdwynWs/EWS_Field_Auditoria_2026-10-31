process.umask(0o077);
import { spawnSync } from "node:child_process";
import { mkdir, cp, writeFile, readdir, lstat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
export function pgEnvironment(url) {
  const u = new URL(url);
  return {
    ...process.env,
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: decodeURIComponent(u.username),
    PGPASSWORD: decodeURIComponent(u.password),
    PGDATABASE: decodeURIComponent(u.pathname.slice(1)),
    PGSSLMODE: u.searchParams.get("sslmode") || "prefer",
  };
}
export function runPg(command, args, url) {
  const r = spawnSync(command, args, {
    env: pgEnvironment(url),
    encoding: "utf8",
  });
  if (r.status !== 0)
    throw Error(
      `${command} falhou. Verifique conectividade, versão do cliente e permissões; saída omitida para proteger dados.`,
    );
  return r.stdout;
}
export async function hashes(dir, prefix = "") {
  const result = {};
  for (const name of await readdir(path.join(dir, prefix))) {
    const key = path.join(prefix, name);
    const entry = await lstat(path.join(dir, key));
    if (entry.isSymbolicLink())
      throw Error("Snapshot contém link simbólico; revise a origem.");
    if (entry.isDirectory()) Object.assign(result, await hashes(dir, key));
    else {
      const hash = createHash("sha256");
      for await (const chunk of createReadStream(path.join(dir, key)))
        hash.update(chunk);
      result[key] = hash.digest("hex");
    }
  }
  return result;
}
export async function backup({ url, mediaDir, destination }) {
  if (!url || !mediaDir || !destination)
    throw Error("Configure DATABASE_URL, MEDIA_DIR e BACKUP_DIR.");
  if (process.env.BACKUP_WRITES_PAUSED !== "true")
    throw Error(
      "Pause escritas antes do snapshot consistente e confirme BACKUP_WRITES_PAUSED=true.",
    );
  const dir = path.resolve(destination);
  const relative = path.relative(path.resolve(mediaDir), dir);
  if (
    !relative ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  )
    throw Error("Backup deve ficar fora do diretório de fotos.");
  await mkdir(dir, { recursive: false, mode: 0o700 });
  runPg(
    "pg_dump",
    [
      "--format=custom",
      "--no-owner",
      "--no-acl",
      "--file",
      path.join(dir, "database.dump"),
    ],
    url,
  );
  await cp(path.resolve(mediaDir), path.join(dir, "media"), {
    recursive: true,
    errorOnExist: true,
  });
  await writeFile(
    path.join(dir, "manifest.json"),
    JSON.stringify(
      {
        format: 1,
        created_at: new Date().toISOString(),
        sha256: await hashes(dir),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  return dir;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await backup({
      url: process.env.DATABASE_URL,
      mediaDir: process.env.MEDIA_DIR,
      destination: process.env.BACKUP_DIR,
    });
    console.log(
      "Backup concluído. Criptografe e replique antes de reter fora do servidor.",
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}
