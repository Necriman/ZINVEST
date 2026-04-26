import type { CashFlowScenario, ForecastInsight, MonthlyPoint, UserFinancialProfile } from "./types";
import { computeMetrics } from "./financialEngine";
import { oneTimeTotal } from "./normalize";

export type ForecastParams = {
  months: number;
  incomeGrowthAnnual: number;
  /** Expense / cost-side growth (applied to recurring outflows). */
  expenseInflationAnnual: number;
  /** Optional headline CPI-style assumption for reporting & AI (defaults to expense inflation). */
  headlineInflationAnnual?: number;
  scenario?: CashFlowScenario;
};

function monthLabel(index: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + index);
  return d.toLocaleString(undefined, { month: "short", year: "2-digit" });
}

export function buildForecast(
  profile: UserFinancialProfile,
  params: ForecastParams,
): MonthlyPoint[] {
  const { months, incomeGrowthAnnual, expenseInflationAnnual, scenario } = params;
  const base = computeMetrics(profile);
  const gM = Math.pow(1 + incomeGrowthAnnual, 1 / 12) - 1;
  const eM = Math.pow(1 + expenseInflationAnnual, 1 / 12) - 1;

  const incomeShock = scenario?.enabledIncomeShock
    ? Math.max(0, Math.min(0.7, scenario.incomeDropPercent / 100))
    : 0;

  const purchase =
    scenario?.enabledPurchase && scenario.purchaseAmount > 0 ? scenario.purchaseAmount : 0;

  const points: MonthlyPoint[] = [];

  const recurringOutflows =
    base.monthlyOperatingExpenses +
    base.monthlyDebtPayments +
    base.monthlySavingsAllocations +
    base.monthlyInvestmentAllocations;

  const oneTimeIncome = profile.income_sources.reduce(
    (s, i) => s + oneTimeTotal(i.amount, i.frequency),
    0,
  );

  for (let m = 0; m < months; m++) {
    const incomeBase = base.monthlyIncome * Math.pow(1 + gM, m) * (1 - incomeShock);
    const income = incomeBase + (m === 0 ? oneTimeIncome : 0);

    let expenses = recurringOutflows * Math.pow(1 + eM, m);
    if (m === 0) {
      const oneTimeSpend =
        profile.fixed_expenses.reduce((s, i) => s + oneTimeTotal(i.amount, i.frequency), 0) +
        profile.variable_expenses.reduce((s, i) => s + oneTimeTotal(i.amount, i.frequency), 0) +
        profile.debts.reduce((s, i) => s + oneTimeTotal(i.amount, i.frequency), 0) +
        profile.savings.reduce((s, i) => s + oneTimeTotal(i.amount, i.frequency), 0) +
        profile.investments.reduce((s, i) => s + oneTimeTotal(i.amount, i.frequency), 0);
      expenses += oneTimeSpend + purchase;
    }

    const net = income - expenses;
    points.push({ monthIndex: m, label: monthLabel(m), income, expenses, net });
  }

  return points;
}

export function buildForecastInsight(forecast: MonthlyPoint[]): ForecastInsight {
  let firstNegativeNetMonthIndex: number | null = null;
  for (let i = 0; i < forecast.length; i++) {
    if (forecast[i].net < 0) {
      firstNegativeNetMonthIndex = i;
      break;
    }
  }

  let cumulativeDeficitMonthIndex: number | null = null;
  let running = 0;
  let minRunning = 0;
  for (let i = 0; i < forecast.length; i++) {
    running += forecast[i].net;
    minRunning = Math.min(minRunning, running);
    if (running < 0 && cumulativeDeficitMonthIndex === null) {
      cumulativeDeficitMonthIndex = i;
    }
  }

  return {
    firstNegativeNetMonthIndex,
    cumulativeDeficitMonthIndex,
    minRunningNetPosition: minRunning,
  };
}
