import { xchacha20poly1305 } from "@noble/ciphers/chacha";
import {
  bytesToHex,
  hexToBytes,
  utf8ToBytes,
  bytesToUtf8,
} from "@noble/ciphers/utils";
export function seal(value, key, nonce, owner) {
  return JSON.stringify({
    v: 1,
    nonce: bytesToHex(nonce),
    data: bytesToHex(
      xchacha20poly1305(key, nonce, utf8ToBytes(owner)).encrypt(
        utf8ToBytes(JSON.stringify(value)),
      ),
    ),
  });
}
export function unseal(value, key, owner) {
  const envelope = JSON.parse(value);
  if (envelope.v !== 1) throw Error("Formato de fila não suportado.");
  return JSON.parse(
    bytesToUtf8(
      xchacha20poly1305(
        key,
        hexToBytes(envelope.nonce),
        utf8ToBytes(owner),
      ).decrypt(hexToBytes(envelope.data)),
    ),
  );
}
