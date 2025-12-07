import { NextResponse } from "next/server";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    const form = await req.formData();
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    console.log("[upload proxy] auth header:", auth);
    const res = await fetch(`${base}/api/v1/attachments/requisition/${encodeURIComponent(id)}/upload`, {
      method: "POST",
      headers: {
        accept: "*/*",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: form,
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