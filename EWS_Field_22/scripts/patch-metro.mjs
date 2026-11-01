import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);

const filename = path.join(
  path.dirname(require.resolve("metro/package.json")),
  "src/Assets.js",
);

const original =
  'var _imageSize = _interopRequireDefault(require("image-size"));';

const patchedOld =
  'var _imageSize = { default: require("image-size").imageSize };';

const patchedNew =
  'var _imageSize = { default: (input) => require("image-size").imageSize(typeof input === "string" ? require("fs").readFileSync(input) : input) };';

const source = await readFile(filename, "utf8");

if (source.includes(patchedNew)) {
  console.log("Metro já corrigido.");
} else if (source.includes(patchedOld)) {
  await writeFile(filename, source.replace(patchedOld, patchedNew));
  console.log("Compatibilidade Metro corrigida.");
} else if (source.includes(original)) {
  await writeFile(filename, source.replace(original, patchedNew));
  console.log("Compatibilidade Metro corrigida.");
} else {
  throw new Error("Versão do Metro diferente da esperada. Revisar Assets.js.");
}
