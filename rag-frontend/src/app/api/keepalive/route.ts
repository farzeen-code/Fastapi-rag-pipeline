import { NextResponse } from "next/server";

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ error: "API_URL not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`${apiUrl}/`, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json({
      ok: true,
      status: res.status,
      backend: data,
      pingedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err), pingedAt: new Date().toISOString() },
      { status: 502 }
    );
  }
}
