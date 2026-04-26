import { NextResponse } from "next/server";
import type {
  CashFlowAIResult,
  CashFlowEngineResult,
  UserFinancialProfile,
} from "@/lib/cash-flow/types";
import type { ForecastParams } from "@/lib/cash-flow/cashFlowOrchestrator";
import { runCashFlowEngine } from "@/lib/cash-flow/cashFlowOrchestrator";
import {
  buildAdvisorUserPrompt,
  buildFullAdvisoryPayload,
  CASH_FLOW_ADVISOR_SYSTEM,
} from "@/lib/cash-flow/aiAnalyzer";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeJsonParse(raw: string): unknown | null {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    /* ignore */
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch {
      return null;
    }
  }
  return null;
}

type Body = {
  profile: UserFinancialProfile;
  forecast: ForecastParams;
  enginePreview?: CashFlowEngineResult;
  language?: string;
};

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured.", code: "MISSING_ANTHROPIC_KEY" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body?.profile || typeof body.profile !== "object") {
    return NextResponse.json({ error: "profile is required." }, { status: 400 });
  }

  const model = process.env.ANTHROPIC_RISK_MODEL?.trim() || "claude-sonnet-4-5";

  const engine =
    body.enginePreview && body.enginePreview.metrics
      ? body.enginePreview
      : runCashFlowEngine(body.profile, body.forecast);

  const payload = buildFullAdvisoryPayload({
    profile: body.profile,
    forecast: body.forecast,
    engine,
    language: body.language,
  });

  const userPrompt = buildAdvisorUserPrompt(payload);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        temperature: 0.25,
        system: CASH_FLOW_ADVISOR_SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "Claude API error.", detail: errText.slice(0, 400) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ text?: string }>;
    };
    const text = data?.content?.map((b) => b?.text ?? "").join("") ?? "";
    const parsed = safeJsonParse(String(text)) as Partial<CashFlowAIResult> & {
      whatToFixImmediately?: string;
      fixImmediately?: string;
    } | null;

    if (!parsed || typeof parsed.summary !== "string") {
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 502 });
    }

    const risk = String(parsed.riskLevel ?? "Medium").trim();
    const riskLevel =
      risk.toLowerCase().includes("high")
        ? "High"
        : risk.toLowerCase().includes("low")
          ? "Low"
          : "Medium";

    const immediateRaw =
      parsed.immediatePriority ?? parsed.whatToFixImmediately ?? parsed.fixImmediately ?? "";
    const immediatePriority =
      typeof immediateRaw === "string" && immediateRaw.trim()
        ? immediateRaw.trim().slice(0, 280)
        : undefined;

    const recs = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map(String).slice(0, 3)
      : [];

    const out: CashFlowAIResult = {
      summary: parsed.summary.slice(0, 400),
      keyProblems: Array.isArray(parsed.keyProblems)
        ? parsed.keyProblems.map(String).slice(0, 8)
        : [],
      recommendations: recs.length ? recs : [],
      riskLevel,
      confidenceScore: clamp(Number(parsed.confidenceScore ?? 72), 0, 100),
      immediatePriority,
    };

    return NextResponse.json({ result: out, engine });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    if (msg.includes("abort")) {
      return NextResponse.json({ error: "Analysis timed out." }, { status: 504 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    clearTimeout(timer);
  }
}
