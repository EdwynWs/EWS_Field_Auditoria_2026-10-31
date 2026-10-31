// Metro 0.83 imports image-size 1.x as a callable CommonJS export.
// image-size 2.0.4 fixes DoS advisories and exposes the function as imageSize.
// Apply exactly this compatibility change; fail on upstream drift for review.
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
let filename;
try {
  filename = path.join(
    path.dirname(require.resolve("metro/package.json")),
    "src/Assets.js",
  );
} catch {
  process.exit(0);
} // API-only production install does not include Metro.
const before =
  'var _imageSize = _interopRequireDefault(require("image-size"));';
const after = 'var _imageSize = { default: require("image-size").imageSize };';
const source = await readFile(filename, "utf8");
if (source.includes(before))
  await writeFile(filename, source.replace(before, after));
else if (!source.includes(after))
  throw Error(
    "Metro import changed; review the image-size compatibility patch.",
  );
