import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/requisitions/${encodeURIComponent(id)}/approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify(body),
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