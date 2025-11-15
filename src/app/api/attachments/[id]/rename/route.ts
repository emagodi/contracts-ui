import { NextResponse } from "next/server";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/attachments/${encodeURIComponent(id)}/rename`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";