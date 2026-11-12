import * as FileSystem from "expo-file-system/legacy";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { bytesToHex, hexToBytes } from "@noble/ciphers/utils";
import { seal, unseal } from "./outbox-codec.mjs";
import { API_URL } from "./config";
let serial = Promise.resolve();
const lock = (fn) => {
  const result = serial.then(fn);
  serial = result.catch(() => {});
  return result;
};
async function context(user) {
  if (Platform.OS === "web" || !FileSystem.documentDirectory)
    throw Error(
      "Reenvio persistente disponível apenas no aplicativo Android/iOS.",
    );
  if (!user?.id || !user?.company_id)
    throw Error("Entre novamente para recuperar os envios.");
  const owner = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${API_URL}:${user.company_id}:${user.id}`,
  );
  const name = "ews_outbox_" + owner;
  let stored = await SecureStore.getItemAsync(name);
  if (!stored) {
    stored = bytesToHex(await Crypto.getRandomBytesAsync(32));
    await SecureStore.setItemAsync(name, stored, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  const dir = FileSystem.documentDirectory + "outbox-" + owner + "/";
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return { owner, key: hexToBytes(stored), dir };
}
async function entries(ctx) {
  const names = (await FileSystem.readDirectoryAsync(ctx.dir)).filter((x) =>
    /^[a-f0-9]{64}\.json$/.test(x),
  );
  const result = [];
  for (const name of names)
    result.push({
      ...unseal(
        await FileSystem.readAsStringAsync(ctx.dir + name),
        ctx.key,
        ctx.owner,
      ),
      file: name,
    });
  return result.sort(
    (a, b) => a.created_at - b.created_at || a.key.localeCompare(b.key),
  );
}
export const outbox = {
  list: (user) => lock(async () => entries(await context(user))),
  enqueue: (user, path, body) =>
    lock(async () => {
      if (!/^\/orders\/[a-f0-9-]{36}\/(visits|reports)$/.test(path))
        throw Error("Operação não permitida na fila.");
      const ctx = await context(user);
      const signature = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        path + JSON.stringify(body),
      );
      const filename = signature + ".json";
      const prior = await entries(ctx);
      const existing = prior.find((x) => x.file === filename);
      if (existing) return existing;
      const item = {
        key: Crypto.randomUUID(),
        path,
        body,
        created_at: Date.now(),
        file: filename,
      };
      if (
        prior.length >= 20 ||
        JSON.stringify([...prior, item]).length > 30_000_000
      )
        throw Error(
          "Fila cheia. Sincronize os envios pendentes antes de continuar.",
        );
      const encrypted = seal(
        item,
        ctx.key,
        await Crypto.getRandomBytesAsync(24),
        ctx.owner,
      );
      const temp = ctx.dir + signature + ".tmp";
      await FileSystem.writeAsStringAsync(temp, encrypted);
      await FileSystem.moveAsync({ from: temp, to: ctx.dir + filename });
      return item;
    }),
  remove: (user, item) =>
    lock(async () => {
      if (!/^[a-f0-9]{64}\.json$/.test(item.file))
        throw Error("Registro inválido.");
      const ctx = await context(user);
      await FileSystem.deleteAsync(ctx.dir + item.file, { idempotent: true });
    }),
  clear: (user) =>
    lock(async () => {
      const ctx = await context(user);
      await FileSystem.deleteAsync(ctx.dir, { idempotent: true });
    }),
};
