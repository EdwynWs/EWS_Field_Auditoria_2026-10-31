import { execFileSync } from "node:child_process";
const commits = execFileSync("git", ["rev-list", "--all"], { encoding: "utf8" })
  .trim()
  .split("\n");
const seen = new Set(),
  findings = [];
const patterns = [
  /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|github_pat)_[A-Za-z0-9_]{30,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /postgres(?:ql)?:\/\/[^\s:'"]+:[^\s@'"${}]+@(?!(?:localhost|127\.0\.0\.1|postgres|db)(?::|\/))/i,
];
for (const commit of commits) {
  const files = execFileSync("git", ["ls-tree", "-r", commit], {
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  for (const line of files) {
    const m = line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    const content = execFileSync("git", ["cat-file", "blob", m[1]], {
      maxBuffer: 10 * 1024 * 1024,
    }).toString("utf8");
    if (
      /(^|\/)\.env(\.local|\.production)?$/.test(m[2]) ||
      patterns.some((re) => re.test(content))
    )
      findings.push({ commit: commit.slice(0, 12), path: m[2] });
  }
}
console.log(
  JSON.stringify({
    commits: commits.length,
    unique_blobs: seen.size,
    findings,
  }),
);
if (findings.length) process.exitCode = 1;
