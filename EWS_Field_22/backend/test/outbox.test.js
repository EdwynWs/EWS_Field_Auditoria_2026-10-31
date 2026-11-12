import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { seal, unseal } from "../../mobile/outbox-codec.mjs";
test("durable outbox ciphertext survives reload and rejects another account or tampering", () => {
  const key = randomBytes(32),
    nonce = randomBytes(24),
    owner = "api:company-a:user-a";
  const item = {
    key: "stable-idempotency-key",
    body: {
      notes: "Private field report",
      latitude: 12,
      photo_data: "private-photo",
    },
  };
  const disk = seal(item, key, nonce, owner);
  assert.ok(!disk.includes("Private field report"));
  assert.deepEqual(unseal(disk, key, owner), item);
  assert.throws(() => unseal(disk, key, "api:company-b:user-b"));
  assert.throws(() => unseal(disk, randomBytes(32), owner));
  const changed = JSON.parse(disk);
  changed.data = (changed.data[0] === "0" ? "1" : "0") + changed.data.slice(1);
  assert.throws(() => unseal(JSON.stringify(changed), key, owner));
});
