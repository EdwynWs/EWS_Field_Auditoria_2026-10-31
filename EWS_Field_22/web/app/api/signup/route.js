import { NextResponse } from "next/server";
import {
  backendUrl,
  jsonError,
  sameOrigin,
  limitedBody,
} from "../../../lib/server-api";
export const runtime = "nodejs";
export async function POST(req) {
  if (!sameOrigin(req)) return jsonError("Origem não autorizada.", 403);
  try {
    const body = await limitedBody(req, 16384);
    const r = await fetch(`${backendUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok)
      return jsonError(out.error || "Não foi possível cadastrar.", r.status);
    // The registration session is immediately revoked; signup requires a separate login.
    if (out.token) {
      const revoked = await fetch(`${backendUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${out.token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      });
      if (!revoked.ok)
        return jsonError("Cadastro criado. Acesse o painel para entrar.", 502);
    }
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return jsonError(
      e.status ? e.message : "Cadastro indisponível. Tente novamente.",
      e.status || 503,
    );
  }
}
