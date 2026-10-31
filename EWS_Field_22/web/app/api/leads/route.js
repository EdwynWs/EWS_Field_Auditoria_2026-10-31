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
    const r = await fetch(`${backendUrl()}/public/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok)
      return jsonError(out.error || "Não foi possível enviar.", r.status);
    return NextResponse.json(
      { ok: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return jsonError(
      e.status ? e.message : "Contato indisponível. Tente novamente.",
      e.status || 503,
    );
  }
}
