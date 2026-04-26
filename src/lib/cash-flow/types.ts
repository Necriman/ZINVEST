export type CashFlowFrequency = "monthly" | "yearly" | "one-time";

export type ExpenseCategory =
  | "housing"
  | "food"
  | "transport"
  | "subscriptions"
  | "other";

export type CashLineItem = {
  id: string;
  name: string;
  amount: number;
  frequency: CashFlowFrequency;
  /** For expenses: drives breakdown chart + leak detection */
  category?: ExpenseCategory;
};

export type DebtItem = {
  id: string;
  name: string;
  /** Minimum monthly payment (or full payment plan amount) */
  amount: number;
  frequency: CashFlowFrequency;
  principalOutstanding?: number;
};

export type UserFinancialProfile = {
  income_sources: CashLineItem[];
  fixed_expenses: CashLineItem[];
  variable_expenses: CashLineItem[];
  debts: DebtItem[];
  /** Monthly amount you intend to set aside */
  savings: CashLineItem[];
  /** Monthly / periodic investment contributions */
  investments: CashLineItem[];
};

export type CashFlowScenario = {
  enabledPurchase: boolean;
  /** One-time purchase price (applied in forecast month 0 only for drawing) */
  purchaseAmount: number;
  purchaseLabel: string;
  enabledIncomeShock: boolean;
  /** 0–70 (%), reduces baseline income in projections */
  incomeDropPercent: number;
};

export type MonthlyPoint = {
  monthIndex: number;
  label: string;
  income: number;
  expenses: number;
  net: number;
};

export type CashFlowMetrics = {
  monthlyIncome: number;
  monthlyOperatingExpenses: number;
  monthlyDebtPayments: number;
  monthlySavingsAllocations: number;
  monthlyInvestmentAllocations: number;
  monthlyTotalOutflows: number;
  netCashFlow: number;
  savingsRatePercent: number;
  expenseRatio: number;
};

export type RiskFlag = {
  code: string;
  severity: "info" | "warn" | "critical";
  params?: Record<string, string | number>;
};

export type SmartSuggestion = {
  id: string;
  impact: "low" | "medium" | "high";
  params?: Record<string, string | number>;
};

/** Cumulative / structural signals from the forecast (no extra UI). */
export type ForecastInsight = {
  firstNegativeNetMonthIndex: number | null;
  /** First month index where sum(net₀…n) < 0 assuming starting cash 0. */
  cumulativeDeficitMonthIndex: number | null;
  minRunningNetPosition: number;
};

export type EngineAnalytics = {
  /** Monthly cash burn when net is negative; 0 when surplus. */
  burnRateMonthly: number;
  /** 1-based month when cumulative position drops below zero; null if not within horizon. */
  runwayBreachMonth: number | null;
  stabilityScore: number;
  /** Savings + investments as % of income (budget allocation). */
  allocationRatePercent: number;
  /** Net / income × 100. */
  netMarginPercent: number;
};

export type CardInsightId = "income" | "expenses" | "net" | "savingsRate";

export type CardInsight = {
  level: "warn" | "critical";
  code: string;
  params?: Record<string, string | number>;
};

export type CardInsightMap = Partial<Record<CardInsightId, CardInsight>>;

export type CashFlowEngineResult = {
  metrics: CashFlowMetrics;
  forecast: MonthlyPoint[];
  forecastInsight: ForecastInsight;
  analytics: EngineAnalytics;
  cardInsights: CardInsightMap;
  risks: RiskFlag[];
  suggestions: SmartSuggestion[];
  categoryBreakdown: Record<ExpenseCategory, number>;
};

export type CashFlowAIResult = {
  summary: string;
  keyProblems: string[];
  recommendations: string[];
  riskLevel: "Low" | "Medium" | "High";
  confidenceScore: number;
  /** “Fix immediately” line when model returns it. */
  immediatePriority?: string;
};
