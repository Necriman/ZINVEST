import type { Language } from "@/lib/translations";
import type { AnalyzeAnswers, RiskScoringResult, AnalysisType } from "./scoring";
import type { SimulationResult } from "./simulation";

export type RiskAIOutput = {
  dealRisk: number;
  userRisk: number;
  aiScore: number;
  verdict: "SAFE" | "CAUTION" | "HIGH RISK";
  confidence: number;
  reasons: string[];
  explanation: string;
  recommendations: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeJsonParse(raw: string): any | null {
  const text = raw.trim();
  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  }
  return null;
}

type GenerateRiskAIExplanationParams = {
  language: Language;
  analysisType: AnalysisType;
  answers: AnalyzeAnswers;
  scoring: RiskScoringResult;
  simulation?: SimulationResult | null;
};

export async function generateRiskAIExplanation(
  params: GenerateRiskAIExplanationParams
): Promise<RiskAIOutput | null> {
  const { language, analysisType, answers, scoring, simulation } = params;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBaseUrl = process.env.OPENAI_API_BASE_URL?.trim() || "https://api.openai.com";
  const openaiModel = process.env.OPENAI_RISK_MODEL?.trim() || "gpt-4o-mini";

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const anthropicModel = process.env.ANTHROPIC_RISK_MODEL?.trim() || "claude-sonnet-4-5";

  const deterministicPayload = {
    scenario: analysisType === "loan" ? "lend" : analysisType,
    overallRisk: scoring.score,
    dealRisk: scoring.dealRiskScore,
    userRisk: scoring.userCapacityScore,
    verdict: scoring.verdict,
    confidence: scoring.confidence,
    interactionBonus: scoring.interactionBonus,
    reasons: scoring.keyRisks.length ? scoring.keyRisks : scoring.reasons,
    recommendations: scoring.recommendations,
    explanation: scoring.explanation,
    simulation,
  };

  const aiSystemPrompt = `You are an AI financial risk analyst inside the ZINVEST system.
Analyze real user financial situations critically like a bank risk analyst.

Rules:
- Output ONLY valid JSON (no markdown, no comments, no extra text).
- Be realistic and decision-focused.
- Consider combined risks (interaction effects).
- Multiple risks should increase severity nonlinearly.
- Use clear practical language.
- Do not provide personalized investment advice.

STRICT OUTPUT SCHEMA:
{
  "dealRisk": number,
  "userRisk": number,
  "aiScore": number,
  "verdict": "SAFE" | "CAUTION" | "HIGH RISK",
  "confidence": number,
  "reasons": ["string", "string"],
  "explanation": "detailed explanation",
  "recommendations": ["string", "string"]
}`;

  const aiUserPrompt = `Language: ${language}
Input JSON:
{
  "scenario": "${analysisType === "loan" ? "lend" : analysisType}",
  "amount": ${Number(answers.amount ?? 0)},
  "income": ${Number(answers.income ?? 0)},
  "contract": ${Boolean(answers.contract)},
  "relationship": "${answers.relationship ?? "known"}",
  "deadline_days": ${Number(answers.deadline ?? 0)}
}

Extended structured answers:
${JSON.stringify(answers)}

Deterministic baseline (keep numbers close and consistent):
${JSON.stringify(deterministicPayload)}

Return strict JSON schema exactly.
Consider worst-case scenarios and combined risks.
`;

  const normalizeVerdict = (v: unknown): "SAFE" | "CAUTION" | "HIGH RISK" => {
    const text = String(v ?? "").toUpperCase().trim();
    if (text.includes("HIGH")) return "HIGH RISK";
    if (text.includes("CAUTION")) return "CAUTION";
    if (text.includes("SAFE")) return "SAFE";
    // fallback from numeric baseline
    if (scoring.score > 70) return "HIGH RISK";
    if (scoring.score > 45) return "CAUTION";
    return "SAFE";
  };

  const timeoutMs = (() => {
    const raw = process.env.AI_RISK_TIMEOUT_MS;
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 25000;
  })();

  try {
    if (openaiKey) {
      const url = `${openaiBaseUrl.replace(/\/$/, "")}/v1/chat/completions`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            temperature: 0.2,
            messages: [
              { role: "system", content: aiSystemPrompt },
              { role: "user", content: aiUserPrompt },
            ],
            response_format: { type: "json_object" },
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        const content =
          data?.choices?.[0]?.message?.content ??
          data?.choices?.[0]?.text ??
          "";
        const parsed = safeJsonParse(String(content));
        if (!parsed) return null;

        const out: RiskAIOutput = {
          dealRisk: clamp(Number(parsed.dealRisk ?? scoring.dealRiskScore), 0, 100),
          userRisk: clamp(Number(parsed.userRisk ?? scoring.userCapacityScore), 0, 100),
          aiScore: clamp(
            Number(
              parsed.aiScore ??
                Math.round((Number(parsed.dealRisk ?? scoring.dealRiskScore) * 0.6) + (Number(parsed.userRisk ?? scoring.userCapacityScore) * 0.4))
            ),
            0,
            100
          ),
          verdict: normalizeVerdict(parsed.verdict),
          confidence: clamp(Number(parsed.confidence ?? scoring.confidence), 0, 100),
          reasons: Array.isArray(parsed.reasons)
            ? parsed.reasons.map(String).slice(0, 8)
            : scoring.keyRisks.slice(0, 8),
          explanation: String(parsed.explanation ?? ""),
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.map(String)
            : [],
        };
        if (!out.explanation) return null;
        // Small clamp to avoid runaway lengths (no hard limit needed, but keep safe).
        out.explanation = out.explanation.slice(0, 6000);
        if (!out.recommendations.length) out.recommendations = scoring.recommendations.slice(0, 6);
        if (!out.reasons.length) out.reasons = scoring.keyRisks.slice(0, 8);
        return out;
      } finally {
        clearTimeout(timer);
      }
    }

    if (anthropicKey) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": anthropicKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: 1200,
            temperature: 0.2,
            system: aiSystemPrompt,
            messages: [{ role: "user", content: aiUserPrompt }],
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          return null;
        }
        const data = await res.json();
        const text =
          data?.content?.map((b: any) => b?.text ?? "").join("") ?? "";
        const parsed = safeJsonParse(String(text));
        if (!parsed) return null;

        const out: RiskAIOutput = {
          dealRisk: clamp(Number(parsed.dealRisk ?? scoring.dealRiskScore), 0, 100),
          userRisk: clamp(Number(parsed.userRisk ?? scoring.userCapacityScore), 0, 100),
          aiScore: clamp(
            Number(
              parsed.aiScore ??
                Math.round((Number(parsed.dealRisk ?? scoring.dealRiskScore) * 0.6) + (Number(parsed.userRisk ?? scoring.userCapacityScore) * 0.4))
            ),
            0,
            100
          ),
          verdict: normalizeVerdict(parsed.verdict),
          confidence: clamp(Number(parsed.confidence ?? scoring.confidence), 0, 100),
          reasons: Array.isArray(parsed.reasons)
            ? parsed.reasons.map(String).slice(0, 8)
            : scoring.keyRisks.slice(0, 8),
          explanation: String(parsed.explanation ?? ""),
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.map(String)
            : [],
        };
        if (!out.explanation) return null;
        out.explanation = out.explanation.slice(0, 6000);
        if (!out.recommendations.length) out.recommendations = scoring.recommendations.slice(0, 6);
        if (!out.reasons.length) out.reasons = scoring.keyRisks.slice(0, 8);
        return out;
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {
    // Never break the core scoring flow when AI fails.
    return null;
  }

  return null;
}

