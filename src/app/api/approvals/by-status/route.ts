import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:9090";
    const { searchParams } = new URL(req.url);
    const status = (searchParams.get("status") || "").trim();
    if (!status) return NextResponse.json({ message: "Missing status" }, { status: 400 });
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/approvals/by-status/${encodeURIComponent(status)}`, {
      method: "GET",
      headers: { accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
    });
    const text = await res.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { data = text; }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";