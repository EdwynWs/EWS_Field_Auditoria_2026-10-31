import { NextResponse } from "next/server";
import {
  backendUrl,
  cookieName,
  jsonError,
  sameOrigin,
  limitedBody,
  setSession,
} from "../../../../lib/server-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const id = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const rules = {
  GET: [
    /^(me|dashboard|users|customers|orders)$/,
    new RegExp(`^orders/${id}/(visits|reports)$`),
    new RegExp(`^orders/${id}/media/${id}$`),
    new RegExp(`^orders/${id}/visits/${id}/photo$`),
    new RegExp(`^orders/${id}/reports/${id}/photos/[0-4]$`),
  ],
  POST: [/^(auth\/(login|logout|password)|users|customers|orders)$/],
  PATCH: [
    new RegExp(`^orders/${id}/(status|assignment)$`),
    new RegExp(`^users/${id}/active$`),
  ],
};
async function forward(req, context) {
  const { path } = await context.params;
  const route = Array.isArray(path) ? path.join("/") : "";
  if (!rules[req.method]?.some((re) => re.test(route)))
    return jsonError("Rota não permitida.", 404);
  if (req.method !== "GET" && !sameOrigin(req))
    return jsonError("Origem não autorizada.", 403);
  const token = req.cookies.get(cookieName)?.value;
  if (route !== "auth/login" && !token)
    return jsonError("Não autenticado.", 401);
  try {
    const headers = { Accept: "application/json" };
    if (token && route !== "auth/login")
      headers.Authorization = `Bearer ${token}`;
    const body = req.method === "GET" ? undefined : await limitedBody(req);
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const query = new URLSearchParams();
    for (const key of ["limit", "offset"]) {
      const val = new URL(req.url).searchParams.get(key);
      if (val !== null) query.set(key, val);
    }
    const upstream = await fetch(
      `${backendUrl()}/${route}${query.size ? "?" + query : ""}`,
      {
        method: req.method,
        headers,
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (
      upstream.ok &&
      upstream.headers.get("content-type")?.startsWith("image/jpeg")
    )
      return new NextResponse(await upstream.arrayBuffer(), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    const data = await upstream
      .json()
      .catch(() => ({ error: "Resposta inesperada da API." }));
    const sessionToken = data.token;
    delete data.token;
    const res = NextResponse.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
    for (const name of ["X-Next-Offset", "Retry-After", "X-Request-Id"]) {
      const value = upstream.headers.get(name);
      if (value) res.headers.set(name, value);
    }
    if (route === "auth/login" && upstream.ok) setSession(res, sessionToken);
    if (
      ((route === "auth/logout" || route === "auth/password") && upstream.ok) ||
      upstream.status === 401
    )
      setSession(res, "");
    return res;
  } catch (e) {
    return jsonError(
      e.status ? e.message : "Serviço indisponível. Tente novamente.",
      e.status || 503,
    );
  }
}
export const GET = forward;
export const POST = forward;
export const PATCH = forward;
