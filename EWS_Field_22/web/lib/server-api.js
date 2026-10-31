import { NextResponse } from "next/server";
export const cookieName =
  process.env.NODE_ENV === "production" ? "__Host-ews_session" : "ews_session";
export function backendUrl() {
  const raw =
    process.env.API_INTERNAL_URL ||
    (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:4000");
  if (!raw) throw Error("API_INTERNAL_URL required");
  const u = new URL(raw);
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.pathname !== "/" ||
    !["http:", "https:"].includes(u.protocol)
  )
    throw Error("Invalid API URL");
  if (process.env.NODE_ENV === "production" && u.protocol !== "https:")
    throw Error("HTTPS required");
  return u.origin;
}
export function jsonError(error, status) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function sameOrigin(req) {
  const expected =
    process.env.WEB_PUBLIC_ORIGIN ||
    (process.env.NODE_ENV === "production" ? "" : new URL(req.url).origin);
  return (
    !!expected &&
    req.headers.get("origin") === expected &&
    req.headers.get("sec-fetch-site") !== "cross-site"
  );
}
export async function limitedBody(req, max = 65536) {
  if (
    !req.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw Object.assign(Error("Envie JSON."), { status: 415 });
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw Object.assign(Error("Solicitação muito grande."), { status: 413 });
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export function setSession(res, token) {
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: token ? 3600 : 0,
  });
}
