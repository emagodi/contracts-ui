import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const headers: Record<string, string> = {
      accept: "*/*",
      ...(auth ? { Authorization: auth } : {}),
    };
    const res = await fetch(`${base}/api/v1/requisitions/find/${encodeURIComponent(id)}`, {
      method: "GET",
      headers,
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