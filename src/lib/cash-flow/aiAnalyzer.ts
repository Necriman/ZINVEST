import type { CashFlowEngineResult, UserFinancialProfile } from "./types";
import type { ForecastParams } from "./forecastEngine";

export const CASH_FLOW_ADVISOR_SYSTEM = `You are a professional financial advisor for Zinvest users.

You receive COMPLETE structured JSON: raw workbook entries, derived monthly metrics, analytics (burn, runway, stability), a 12‑month forecast (income/expense/net per month), scenario toggles, and deterministic risk signals.

Your job:
- Think like a practitioner: cash timing, structural load, and realistic trade-offs.
- Never invent balances not in the payload; if data is sparse, say so briefly in main risks.

Return ONLY valid JSON (no markdown, no commentary). Use this schema exactly:
{
  "summary": "string, max 360 chars",
  "keyProblems": ["string"],
  "recommendations": ["exactly 3 short actionable steps, ordered by impact"],
  "riskLevel": "Low" | "Medium" | "High",
  "confidenceScore": number,
  "immediatePriority": "one sentence: what to fix first this week"
}

confidenceScore is 0–100 based on input completeness and consistency.`;

export function buildFullAdvisoryPayload(params: {
  profile: UserFinancialProfile;
  forecast: ForecastParams;
  engine: CashFlowEngineResult;
  language?: string;
}): Record<string, unknown> {
  const { profile, forecast, engine, language } = params;
  const headlineInflation =
    forecast.headlineInflationAnnual ?? forecast.expenseInflationAnnual;

  return {
    language: language ?? "en",
    profile,
    derived: {
      metrics: engine.metrics,
      categoryBreakdown: engine.categoryBreakdown,
      analytics: engine.analytics,
      forecastInsight: engine.forecastInsight,
      cardInsights: engine.cardInsights,
    },
    assumptions: {
      incomeGrowthAnnual: forecast.incomeGrowthAnnual,
      expenseGrowthAnnual: forecast.expenseInflationAnnual,
      headlineInflationAnnual: headlineInflation,
      scenario: forecast.scenario ?? null,
      forecastMonths: forecast.months,
    },
    forecastSeries: engine.forecast.map((p) => ({
      m: p.monthIndex + 1,
      label: p.label,
      income: Math.round(p.income),
      expenses: Math.round(p.expenses),
      net: Math.round(p.net),
    })),
    deterministicRisks: engine.risks,
    heuristicSuggestions: engine.suggestions,
  };
}

export function buildAdvisorUserPrompt(payload: Record<string, unknown>): string {
  return `User financial data (JSON):\n${JSON.stringify(payload, null, 2)}\n\nAnalyze cash flow health, main risks, and prioritized moves. Return strict JSON only.`;
}
