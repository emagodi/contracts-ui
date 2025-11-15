import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get("email") || "").trim();
    if (!email) return NextResponse.json({ message: "Missing email" }, { status: 400 });
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/signature/user/email/${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "content-type": "text/plain" } });
  } catch {
    return NextResponse.json({ message: "Proxy error" }, { status: 502 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";