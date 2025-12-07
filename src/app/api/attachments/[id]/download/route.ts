import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/attachments/${encodeURIComponent(id)}/download`, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(auth ? { Authorization: auth } : {}),
      },
    });
    const headers = new Headers();
    res.headers.forEach((v, k) => headers.set(k, v));
    const ab = await res.arrayBuffer();
    return new Response(ab, { status: res.status, headers });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";