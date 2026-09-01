import { NextRequest, NextResponse } from "next/server";

const ALLOWED_PATHS = new Set(["copilot/query", "copilot/brief", "simulate/compare", "simulate/what-if", "decision/recommendations"]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!ALLOWED_PATHS.has(endpoint)) return NextResponse.json({ error: "Unsupported intelligence endpoint" }, { status: 404 });

  const serviceBase = (process.env.INTELLIGENCE_SERVICE_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
  try {
    const upstream = await fetch(`${serviceBase}/api/v1/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    const payload = await upstream.text();
    return new NextResponse(payload, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" } });
  } catch {
    return NextResponse.json({ error: "Intelligence service unavailable; use deterministic frontend fallback." }, { status: 503 });
  }
}
