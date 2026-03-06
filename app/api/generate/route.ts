import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key no configurada en Vercel" }, { status: 500 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message ?? "Error de API" }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.[0]?.text ?? "Error al generar contenido.";
    return NextResponse.json({ text });

  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error interno" }, { status: 500 });
  }
}
// redeploy 1772820554
