import { NextResponse } from "next/server";

export async function POST(req: Request, ctx: { params: { email: string } }) {
  try {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:9090";
    const { email } = ctx.params || ({} as { email: string });
    if (!email) return NextResponse.json({ message: "Missing email" }, { status: 400 });
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const form = await req.formData();
    const res = await fetch(`${base}/api/v1/signature/upload/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: { accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
      body: form,
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