import type {
  CardInsightMap,
  CashFlowMetrics,
  ExpenseCategory,
  ForecastInsight,
  RiskFlag,
  SmartSuggestion,
  UserFinancialProfile,
} from "./types";
import { toMonthlyRunRate } from "./normalize";

export function detectRisks(
  metrics: CashFlowMetrics,
  profile: UserFinancialProfile,
  categoryBreakdown: Record<ExpenseCategory, number>,
  forecastInsight: ForecastInsight,
): RiskFlag[] {
  const risks: RiskFlag[] = [];

  if (metrics.monthlyIncome <= 0) {
    risks.push({
      code: "no_income",
      severity: "critical",
    });
  }

  if (metrics.netCashFlow < 0) {
    risks.push({
      code: "negative_runway",
      severity: "critical",
      params: { amount: Math.round(metrics.netCashFlow) },
    });
  }

  if (
    forecastInsight.cumulativeDeficitMonthIndex !== null &&
    metrics.netCashFlow >= 0
  ) {
    risks.push({
      code: "cumulative_deficit",
      severity: "critical",
      params: { month: forecastInsight.cumulativeDeficitMonthIndex + 1 },
    });
  } else if (
    forecastInsight.firstNegativeNetMonthIndex !== null &&
    metrics.netCashFlow >= 0
  ) {
    risks.push({
      code: "negative_projection_month",
      severity: "warn",
      params: { month: forecastInsight.firstNegativeNetMonthIndex + 1 },
    });
  }

  if (metrics.expenseRatio >= 0.85 && metrics.monthlyIncome > 0) {
    risks.push({
      code: "high_expense_ratio",
      severity: "warn",
      params: { pct: Math.round(metrics.expenseRatio * 100) },
    });
  }

  const incomeItems = profile.income_sources.filter((i) => toMonthlyRunRate(i.amount, i.frequency) > 0);
  const totalInc = metrics.monthlyIncome;
  if (totalInc > 0 && incomeItems.length === 1) {
    risks.push({
      code: "single_income",
      severity: "warn",
    });
  } else if (totalInc > 0 && incomeItems.length >= 2) {
    const maxShare = Math.max(
      ...incomeItems.map((i) => toMonthlyRunRate(i.amount, i.frequency) / totalInc),
    );
    if (maxShare >= 0.92) {
      risks.push({
        code: "dominant_income",
        severity: "info",
      });
    }
  }

  const subTotal = categoryBreakdown.subscriptions;
  if (totalInc > 0 && subTotal / totalInc >= 0.08) {
    risks.push({
      code: "subscription_load",
      severity: "info",
    });
  }

  const housing = categoryBreakdown.housing;
  if (totalInc > 0 && housing / totalInc > 0.35) {
    risks.push({
      code: "housing_stress",
      severity: "warn",
    });
  }

  if (metrics.monthlyIncome > 0 && metrics.savingsRatePercent < 10 && metrics.savingsRatePercent >= 0) {
    risks.push({
      code: "low_savings_rate",
      severity: "warn",
    });
  }

  return risks;
}

export function smartSuggestions(
  metrics: CashFlowMetrics,
  categoryBreakdown: Record<ExpenseCategory, number>,
  profile: UserFinancialProfile,
): SmartSuggestion[] {
  const s: SmartSuggestion[] = [];
  const inc = metrics.monthlyIncome;

  const foodPct = inc > 0 ? categoryBreakdown.food / inc : 0;
  if (foodPct >= 0.22) {
    s.push({
      id: "food_trim",
      impact: foodPct >= 0.28 ? "high" : "medium",
      params: { pct: Math.round(foodPct * 100) },
    });
  }

  const subCount = profile.variable_expenses.filter(
    (e) => e.category === "subscriptions" && toMonthlyRunRate(e.amount, e.frequency) > 0,
  ).length;
  const subPct = inc > 0 ? categoryBreakdown.subscriptions / inc : 0;
  if (subCount >= 3 || subPct >= 0.06) {
    s.push({
      id: "sub_audit",
      impact: subPct >= 0.1 ? "high" : "medium",
      params: { count: subCount, pct: Math.round(subPct * 100) },
    });
  }

  if (metrics.netCashFlow > 0 && metrics.netCashFlow / inc < 0.05 && inc > 0) {
    s.push({
      id: "thin_surplus",
      impact: "medium",
    });
  }

  const variableLeak = profile.variable_expenses
    .filter((e) => e.category === "other")
    .reduce((sum, e) => sum + toMonthlyRunRate(e.amount, e.frequency), 0);
  if (inc > 0 && variableLeak / inc >= 0.12) {
    s.push({
      id: "misc_bucket",
      impact: "low",
    });
  }

  return s;
}

export function buildCardInsights(
  metrics: CashFlowMetrics,
  categoryBreakdown: Record<ExpenseCategory, number>,
  forecastInsight: ForecastInsight,
  profile: UserFinancialProfile,
): CardInsightMap {
  const out: CardInsightMap = {};
  const inc = metrics.monthlyIncome;
  const housingShare = inc > 0 ? categoryBreakdown.housing / inc : 0;

  const incomeItems = profile.income_sources.filter((i) => toMonthlyRunRate(i.amount, i.frequency) > 0);
  if (inc > 0 && incomeItems.length === 1) {
    out.income = {
      level: "warn",
      code: "single_income_stream",
    };
  }

  if (housingShare > 0.35) {
    out.expenses = {
      level: "warn",
      code: "housing_pressure",
    };
  } else if (metrics.expenseRatio >= 0.85 && inc > 0) {
    out.expenses = {
      level: "warn",
      code: "high_load",
    };
  }

  if (metrics.netCashFlow < 0 || forecastInsight.cumulativeDeficitMonthIndex !== null) {
    out.net = {
      level: "critical",
      code:
        forecastInsight.cumulativeDeficitMonthIndex !== null
          ? "net_cumulative_risk"
          : "net_negative",
      params:
        forecastInsight.cumulativeDeficitMonthIndex !== null
          ? { month: forecastInsight.cumulativeDeficitMonthIndex + 1 }
          : undefined,
    };
  } else if (forecastInsight.firstNegativeNetMonthIndex !== null) {
    out.net = {
      level: "warn",
      code: "net_projection_dip",
      params: { month: forecastInsight.firstNegativeNetMonthIndex + 1 },
    };
  }

  if (inc > 0 && metrics.savingsRatePercent < 10) {
    out.savingsRate = {
      level: metrics.savingsRatePercent < 0 ? "critical" : "warn",
      code: metrics.savingsRatePercent < 0 ? "savings_overallocated" : "savings_low",
    };
  }

  return out;
}
