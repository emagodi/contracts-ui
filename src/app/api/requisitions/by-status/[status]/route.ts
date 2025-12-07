import { NextResponse } from "next/server";

export async function GET(req: Request, ctx: { params: Promise<{ status: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { searchParams } = new URL(req.url);
    const qp = searchParams.get("status") || "";
    const { status: awaitedStatus } = await ctx.params;
    const paramStatus = (awaitedStatus ?? "").toString();
    const status = (paramStatus || qp).trim();
    if (!status || status.toLowerCase() === "undefined") {
      return NextResponse.json({ message: "Missing status" }, { status: 400 });
    }
    const url = `${base}/api/v1/requisitions/by-status/${encodeURIComponent(status)}`;
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(url, {
      method: "GET",
      headers: {
        accept: "*/*",
        ...(auth ? { Authorization: auth } : {}),
      },
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