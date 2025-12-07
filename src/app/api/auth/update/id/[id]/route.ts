import { NextResponse } from "next/server";

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { id } = ctx.params || ({} as { id: string });
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const contentType = req.headers.get("content-type") || req.headers.get("Content-Type") || "application/json";
    const bodyText = await req.text();

    const res = await fetch(`${base}/api/v1/auth/update/id/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        accept: "*/*",
        ...(contentType ? { "Content-Type": contentType } : {}),
        ...(auth ? { Authorization: auth } : {}),
      },
      body: bodyText,
    });

    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        const json = JSON.parse(text || "{}");
        return NextResponse.json(json, { status: res.status });
      } catch {
        return new Response(text, { status: res.status, headers: { "content-type": ct || "application/json" } });
      }
    }
    return new Response(text, { status: res.status, headers: { "content-type": ct || "text/plain" } });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";