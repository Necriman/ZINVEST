import type {
  CashFlowMetrics,
  DebtItem,
  EngineAnalytics,
  ExpenseCategory,
  ForecastInsight,
  UserFinancialProfile,
  CashLineItem,
} from "./types";
import { toMonthlyRunRate } from "./normalize";

export function sumLineMonthly(items: CashLineItem[]): number {
  return items.reduce((s, i) => s + toMonthlyRunRate(i.amount, i.frequency), 0);
}

export function sumDebtMonthly(items: DebtItem[]): number {
  return items.reduce((s, i) => s + toMonthlyRunRate(i.amount, i.frequency), 0);
}

export function buildCategoryBreakdown(profile: UserFinancialProfile): Record<ExpenseCategory, number> {
  const out: Record<ExpenseCategory, number> = {
    housing: 0,
    food: 0,
    transport: 0,
    subscriptions: 0,
    other: 0,
  };

  const add = (item: CashLineItem) => {
    const cat = item.category ?? "other";
    out[cat] += toMonthlyRunRate(item.amount, item.frequency);
  };

  profile.fixed_expenses.forEach(add);
  profile.variable_expenses.forEach(add);

  return out;
}

export function computeMetrics(profile: UserFinancialProfile): CashFlowMetrics {
  const monthlyIncome = sumLineMonthly(profile.income_sources);
  const fixed = sumLineMonthly(profile.fixed_expenses);
  const variable = sumLineMonthly(profile.variable_expenses);
  const monthlyOperatingExpenses = fixed + variable;
  const monthlyDebtPayments = sumDebtMonthly(profile.debts);
  const monthlySavingsAllocations = sumLineMonthly(profile.savings);
  const monthlyInvestmentAllocations = sumLineMonthly(profile.investments);

  const monthlyTotalOutflows =
    monthlyOperatingExpenses +
    monthlyDebtPayments +
    monthlySavingsAllocations +
    monthlyInvestmentAllocations;

  const netCashFlow = monthlyIncome - monthlyTotalOutflows;

  const savingsRatePercent =
    monthlyIncome > 0 ? (netCashFlow / monthlyIncome) * 100 : 0;

  const expenseRatio =
    monthlyIncome > 0 ? (monthlyOperatingExpenses + monthlyDebtPayments) / monthlyIncome : 0;

  return {
    monthlyIncome,
    monthlyOperatingExpenses,
    monthlyDebtPayments,
    monthlySavingsAllocations,
    monthlyInvestmentAllocations,
    monthlyTotalOutflows,
    netCashFlow,
    savingsRatePercent,
    expenseRatio,
  };
}

function clampScore(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeFinancialAnalytics(
  metrics: CashFlowMetrics,
  profile: UserFinancialProfile,
  categoryBreakdown: Record<ExpenseCategory, number>,
  forecastInsight: ForecastInsight,
): EngineAnalytics {
  const burnRateMonthly = metrics.netCashFlow < 0 ? Math.abs(metrics.netCashFlow) : 0;

  const runwayBreachMonth =
    forecastInsight.cumulativeDeficitMonthIndex === null
      ? null
      : forecastInsight.cumulativeDeficitMonthIndex + 1;

  const alloc =
    metrics.monthlyIncome > 0
      ? ((metrics.monthlySavingsAllocations + metrics.monthlyInvestmentAllocations) /
          metrics.monthlyIncome) *
        100
      : 0;

  const netMarginPercent =
    metrics.monthlyIncome > 0 ? (metrics.netCashFlow / metrics.monthlyIncome) * 100 : 0;

  let stability = 100;
  if (metrics.netCashFlow < 0) stability -= 26;
  if (metrics.expenseRatio >= 0.85) stability -= 14;
  else if (metrics.expenseRatio >= 0.7) stability -= 7;
  if (metrics.monthlyIncome > 0 && metrics.savingsRatePercent < 10) stability -= 9;
  const housingShare =
    metrics.monthlyIncome > 0 ? categoryBreakdown.housing / metrics.monthlyIncome : 0;
  if (housingShare > 0.35) stability -= 11;
  if (forecastInsight.cumulativeDeficitMonthIndex !== null) stability -= 16;
  else if (forecastInsight.firstNegativeNetMonthIndex !== null) stability -= 7;

  const incomeItems = profile.income_sources.filter((i) => toMonthlyRunRate(i.amount, i.frequency) > 0);
  if (metrics.monthlyIncome > 0 && incomeItems.length === 1) stability -= 9;
  else if (metrics.monthlyIncome > 0 && incomeItems.length >= 2) {
    const maxShare = Math.max(
      ...incomeItems.map((i) => toMonthlyRunRate(i.amount, i.frequency) / metrics.monthlyIncome),
    );
    if (maxShare >= 0.92) stability -= 5;
  }

  return {
    burnRateMonthly,
    runwayBreachMonth,
    stabilityScore: clampScore(stability),
    allocationRatePercent: alloc,
    netMarginPercent,
  };
}