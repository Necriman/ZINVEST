import type { CashFlowEngineResult, UserFinancialProfile } from "./types";
import { buildCategoryBreakdown, computeFinancialAnalytics, computeMetrics } from "./financialEngine";
import type { ForecastParams } from "./forecastEngine";
import { buildForecast, buildForecastInsight } from "./forecastEngine";
import { buildCardInsights, detectRisks, smartSuggestions } from "./riskEngine";

export type { ForecastParams } from "./forecastEngine";

export function runCashFlowEngine(
  profile: UserFinancialProfile,
  forecast: ForecastParams,
): CashFlowEngineResult {
  const metrics = computeMetrics(profile);
  const categoryBreakdown = buildCategoryBreakdown(profile);
  const points = buildForecast(profile, forecast);
  const forecastInsight = buildForecastInsight(points);
  const analytics = computeFinancialAnalytics(metrics, profile, categoryBreakdown, forecastInsight);
  const risks = detectRisks(metrics, profile, categoryBreakdown, forecastInsight);
  const suggestions = smartSuggestions(metrics, categoryBreakdown, profile);
  const cardInsights = buildCardInsights(metrics, categoryBreakdown, forecastInsight, profile);

  return {
    metrics,
    forecast: points,
    forecastInsight,
    analytics,
    cardInsights,
    risks,
    suggestions,
    categoryBreakdown,
  };
}
