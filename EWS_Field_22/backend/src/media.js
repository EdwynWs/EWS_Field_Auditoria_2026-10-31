import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { fail, uuid } from "./security.js";
export async function normalizePhoto(value, { legacy = false } = {}) {
  if (
    typeof value !== "string" ||
    value.length > (legacy ? 4_000_000 : 2_800_000) ||
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    throw fail(400, "Envie uma imagem JPEG, PNG ou WebP de até 2 MB.");
  const data = Buffer.from(value.split(",")[1], "base64");
  if (data.length > (legacy ? 3 : 2) * 1024 * 1024)
    throw fail(413, "Foto muito grande. Limite: 2 MB.");
  try {
    return await sharp(data, { limitInputPixels: 20000000, failOn: "warning" })
      .rotate()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    throw fail(400, "Imagem inválida ou com resolução excessiva.");
  }
}
export function mediaStore(dir) {
  const file = (key) => path.join(path.resolve(dir), uuid.parse(key) + ".jpg");
  return {
    async save(c, req, orderId, buffer, created) {
      const id = randomUUID();
      await mkdir(path.resolve(dir), { recursive: true, mode: 0o700 });
      await writeFile(file(id), buffer, { flag: "wx", mode: 0o600 });
      created.push(id);
      await c.query(
        "INSERT INTO media(id,company_id,order_id,object_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,$5,$6)",
        [id, req.user.companyId, orderId, id, "image/jpeg", buffer.length],
      );
      return id;
    },
    read: (key) => readFile(file(key)),
    async cleanup(ids) {
      for (const id of ids) await unlink(file(id)).catch(() => {});
    },
  };
}
