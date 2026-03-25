import type { Language } from "@/lib/translations";
import type { AnalyzeAnswers, RiskScoringResult, AnalysisType } from "./scoring";

export type RiskAIOutput = {
  explanation: string;
  keyRisks: string[];
  recommendations: string[];
  socialProof: string;
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
};

export async function generateRiskAIExplanation(
  params: GenerateRiskAIExplanationParams
): Promise<RiskAIOutput | null> {
  const { language, analysisType, answers, scoring } = params;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBaseUrl = process.env.OPENAI_API_BASE_URL?.trim() || "https://api.openai.com";
  const openaiModel = process.env.OPENAI_RISK_MODEL?.trim() || "gpt-4o-mini";

  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const anthropicModel = process.env.ANTHROPIC_RISK_MODEL?.trim() || "claude-sonnet-4-5";

  const deterministicPayload = {
    overallRisk: scoring.score,
    dealRisk: scoring.dealRiskScore,
    userRisk: scoring.userCapacityScore,
    verdict: scoring.verdict,
    confidence: scoring.confidence,
    keyRisks: scoring.keyRisks,
    reasons: scoring.reasons,
    recommendations: scoring.recommendations,
    socialProof: scoring.socialProof,
  };

  const aiSystemPrompt = `You are a financial risk analyst for Zinvest.
You generate a human-like, bank-style explanation based on structured answers and computed scores.

Rules:
- Output ONLY valid JSON. No markdown. No extra text.
- Use the user's language exactly.
- Be educational and neutral. Do not give personalized investment advice.
- Provide clear plain-language reasoning and actionable risk mitigations.

Return JSON with this shape:
{
  "explanation": "string",
  "keyRisks": ["string", "..."],
  "recommendations": ["string", "..."],
  "socialProof": "string"
}
`;

  const aiUserPrompt = `Language: ${language}
Scenario type: ${analysisType}

User answers (structured):
${JSON.stringify(answers)}

Computed deterministic risk payload:
${JSON.stringify(deterministicPayload)}

Now generate:
1) explanation: 2-4 short paragraphs, human-like, includes why the risk is elevated.
2) keyRisks: top 3-5 risk drivers, each as a single sentence.
3) recommendations: 3-6 mitigation steps, each as a single sentence.
4) socialProof: simulated statement based on similar cases, include a percentage and what it means.

Keep numbers consistent with the computed payload if you mention them.
`;

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
          explanation: String(parsed.explanation ?? ""),
          keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.map(String) : [],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.map(String)
            : [],
          socialProof: String(parsed.socialProof ?? ""),
        };
        if (!out.explanation) return null;
        // Small clamp to avoid runaway lengths (no hard limit needed, but keep safe).
        out.explanation = out.explanation.slice(0, 6000);
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
          explanation: String(parsed.explanation ?? ""),
          keyRisks: Array.isArray(parsed.keyRisks) ? parsed.keyRisks.map(String) : [],
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations.map(String)
            : [],
          socialProof: String(parsed.socialProof ?? ""),
        };
        if (!out.explanation) return null;
        out.explanation = out.explanation.slice(0, 6000);
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

