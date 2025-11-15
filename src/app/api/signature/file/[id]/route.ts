export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const base = process.env.BACKEND_URL || "http://localhost:8080";
    const { id } = await ctx.params;
    if (!id) return new Response("Missing id", { status: 400 });
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const res = await fetch(`${base}/api/v1/signature/file/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { accept: "*/*", ...(auth ? { Authorization: auth } : {}) },
    });
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return new Response(buffer, { status: res.status, headers: { "content-type": contentType } });
  } catch {
    return new Response("Proxy error", { status: 502 });
  }
}
export const runtime = "nodejs";
export const dynamic = "force-dynamic";