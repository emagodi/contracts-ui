import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ message: "Missing id" }, { status: 400 });
    }
    const urlObj = new URL(req.url);
    const page = urlObj.searchParams.get("page") || "0";
    const size = urlObj.searchParams.get("size") || "10";
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    console.log("[attachments list proxy] auth header:", auth);
    const res = await fetch(`${base}/api/v1/attachments/requisition/${encodeURIComponent(id)}?page=${encodeURIComponent(page)}&size=${encodeURIComponent(size)}`, {
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
export const runtime = "nodejs";
export const dynamic = "force-dynamic";