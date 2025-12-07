import { NextResponse } from "next/server";

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:9090";
    const { id } = ctx.params || ({} as { id: string });
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/signature/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
    });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (ct.includes("application/json")) {
      try { return NextResponse.json(JSON.parse(text || "{}"), { status: res.status }); } catch {}
    }
    return new Response(text, { status: res.status, headers: { "content-type": ct || "text/plain" } });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";