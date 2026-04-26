"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  Brain,
  Loader2,
  PiggyBank,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/components/theme-provider";
import type { cashFlowStudioEn } from "@/lib/cash-flow-studio-copy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  CardInsightId,
  CashFlowAIResult,
  CashFlowEngineResult,
  CashFlowFrequency,
  CashFlowScenario,
  DebtItem,
  ExpenseCategory,
  UserFinancialProfile,
  CashLineItem,
} from "@/lib/cash-flow/types";
import {
  createDefaultProfile,
  loadProfile,
  newId,
  runCashFlowEngine,
  saveProfile,
} from "@/lib/cash-flow";

type CF = typeof cashFlowStudioEn;

const GLASS =
  "rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-white text-slate-900 shadow-sm backdrop-blur-xl dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.02] dark:text-slate-200 dark:shadow-xl dark:shadow-black/20";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Allows clearing the field; empty commits as 0 (raw number inputs snap back to "0"). */
function BudgetNumberInput({
  value,
  onCommit,
  className,
}: {
  value: number;
  onCommit: (n: number) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft !== null ? draft : value === 0 ? "" : String(value);

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={display}
      onFocus={() => setDraft(value === 0 ? "" : String(value))}
      onChange={(e) => {
        const v = e.target.value.replace(",", ".");
        if (v === "" || /^\d*\.?\d*$/.test(v)) {
          setDraft(v);
          if (v === "" || v === ".") onCommit(0);
          else onCommit(Number(v));
        }
      }}
      onBlur={() => setDraft(null)}
      className={className}
    />
  );
}

function OptionalBudgetNumberInput({
  value,
  onCommit,
  className,
  placeholder,
}: {
  value: number | undefined;
  onCommit: (n: number | undefined) => void;
  className?: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const display =
    draft !== null ? draft : value === undefined || value === null ? "" : String(value);

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={display}
      onFocus={() => setDraft(value == null ? "" : String(value))}
      onChange={(e) => {
        const v = e.target.value.replace(",", ".");
        if (v === "" || /^\d*\.?\d*$/.test(v)) {
          setDraft(v);
          if (v === "" || v === ".") onCommit(undefined);
          else onCommit(Number(v));
        }
      }}
      onBlur={() => setDraft(null)}
      className={className}
    />
  );
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

function riskLine(code: string, params: Record<string, string | number> | undefined, cf: CF): string {
  const table = cf.risks as Record<string, string>;
  let resolved = params;
  if (code === "negative_runway" && params && typeof params.amount === "number") {
    resolved = { ...params, amount: money.format(Math.round(params.amount)) };
  }
  return tpl(table[code] ?? code, resolved);
}

function cardInsightHint(code: string, params: Record<string, string | number> | undefined, cf: CF): string {
  const table = cf.cardHints as Record<string, string>;
  return tpl(table[code] ?? code, params);
}

function suggestionTitle(id: string, cf: CF): string {
  const table = cf.suggestionTitles as Record<string, string>;
  return table[id] ?? id;
}

function suggestionDetail(
  id: string,
  params: Record<string, string | number> | undefined,
  cf: CF,
): string {
  const table = cf.suggestions as Record<string, string>;
  return tpl(table[id] ?? "", params);
}

function cardTooltipText(id: CardInsightId, engine: CashFlowEngineResult, cf: CF): string {
  const { metrics, analytics, forecastInsight } = engine;
  const incStr = money.format(Math.round(metrics.monthlyIncome));
  const projLine =
    forecastInsight.firstNegativeNetMonthIndex !== null
      ? tpl(cf.ttIncomeProjNeg, { month: forecastInsight.firstNegativeNetMonthIndex + 1 })
      : cf.ttIncomeProjOk;
  switch (id) {
    case "income":
      return [tpl(cf.ttIncomeLine1, { income: incStr }), tpl(cf.ttIncomeLine2, { stability: analytics.stabilityScore }), projLine].join("\n");
    case "expenses":
      return [
        tpl(cf.ttExpLine1, {
          amount: money.format(Math.round(metrics.monthlyOperatingExpenses + metrics.monthlyDebtPayments)),
        }),
        tpl(cf.ttExpLine2, { pct: (metrics.expenseRatio * 100).toFixed(1) }),
        tpl(cf.ttExpLine3, { total: money.format(Math.round(metrics.monthlyTotalOutflows)) }),
      ].join("\n");
    case "net": {
      const burnLine =
        analytics.burnRateMonthly > 0
          ? tpl(cf.ttNetBurn, { burn: money.format(Math.round(analytics.burnRateMonthly)) })
          : cf.ttNetBurnZero;
      const runwayLine =
        analytics.runwayBreachMonth !== null
          ? tpl(cf.ttNetRunway, { month: analytics.runwayBreachMonth })
          : cf.ttNetRunwayOk;
      return [
        tpl(cf.ttNetLine1, { margin: analytics.netMarginPercent.toFixed(1) }),
        burnLine,
        runwayLine,
        tpl(cf.ttNetStability, { stability: analytics.stabilityScore }),
      ].join("\n");
    }
    case "savingsRate":
      return [
        tpl(cf.ttSaveLine1, { rate: metrics.savingsRatePercent.toFixed(1) }),
        tpl(cf.ttSaveLine2, { alloc: analytics.allocationRatePercent.toFixed(1) }),
      ].join("\n");
    default:
      return "";
  }
}

function riskColor(level: CashFlowAIResult["riskLevel"]) {
  if (level === "High") return "text-red-300 bg-red-500/15 border-red-500/30";
  if (level === "Low") return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
  return "text-amber-200 bg-amber-500/15 border-amber-500/30";
}

function severityDot(sev: "info" | "warn" | "critical") {
  if (sev === "critical") return "bg-red-400";
  if (sev === "warn") return "bg-amber-400";
  return "bg-sky-400";
}

function aiRiskLabel(level: CashFlowAIResult["riskLevel"], cf: CF): string {
  if (level === "High") return cf.riskLevelHigh;
  if (level === "Low") return cf.riskLevelLow;
  return cf.riskLevelMedium;
}

type EditorProps = {
  title: string;
  items: CashLineItem[];
  onChange: (next: CashLineItem[]) => void;
  withCategory?: boolean;
};

function LineItemEditor({ title, items, onChange, withCategory }: EditorProps) {
  const { t } = useLanguage();
  const cf = t.cashFlowStudio;
  const freqs: { v: CashFlowFrequency; l: string }[] = useMemo(
    () => [
      { v: "monthly", l: cf.freqMonthly },
      { v: "yearly", l: cf.freqYearly },
      { v: "one-time", l: cf.freqOneTime },
    ],
    [cf.freqMonthly, cf.freqYearly, cf.freqOneTime],
  );
  const cats: { v: ExpenseCategory; l: string }[] = useMemo(
    () => [
      { v: "housing", l: cf.catHousing },
      { v: "food", l: cf.catFood },
      { v: "transport", l: cf.catTransport },
      { v: "subscriptions", l: cf.catSubscriptions },
      { v: "other", l: cf.catOther },
    ],
    [cf],
  );

  const patch = (id: string, patch: Partial<CashLineItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white/90">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          className="gap-1 text-xs text-sky-300 hover:bg-white/5 hover:text-sky-200"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newId(),
                name: cf.newItem,
                amount: 0,
                frequency: "monthly",
                category: withCategory ? "other" : undefined,
              },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" />
          {cf.add}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((row) => (
          <motion.div
            layout
            key={row.id}
            className="grid gap-2 rounded-xl border border-white/5 bg-black/20 p-3 md:grid-cols-[1.2fr_0.7fr_0.9fr_auto] md:items-end"
          >
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelName}</Label>
              <Input
                value={row.name}
                onChange={(e) => patch(row.id, { name: e.target.value })}
                className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-600"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelAmount}</Label>
              <BudgetNumberInput
                value={Number.isFinite(row.amount) ? row.amount : 0}
                onCommit={(n) => patch(row.id, { amount: n })}
                className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="min-w-[120px] flex-1 space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">
                  {cf.labelFrequency}
                </Label>
                <Select
                  value={row.frequency}
                  onValueChange={(v) => patch(row.id, { frequency: v as CashFlowFrequency })}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#0f1624] dark:text-white">
                    {freqs.map((f) => (
                      <SelectItem key={f.v} value={f.v} className="focus:bg-white/10">
                        {f.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {withCategory && (
                <div className="min-w-[140px] flex-1 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">
                    {cf.labelCategory}
                  </Label>
                  <Select
                    value={row.category ?? "other"}
                    onValueChange={(v) => patch(row.id, { category: v as ExpenseCategory })}
                  >
                    <SelectTrigger className="w-full border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#0f1624] dark:text-white">
                      {cats.map((c) => (
                        <SelectItem key={c.v} value={c.v} className="focus:bg-white/10">
                          {c.l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex justify-end pb-1 md:pb-0">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors touch-manipulation hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/15"
                aria-label={cf.removeRow}
                onClick={() => onChange(items.filter((i) => i.id !== row.id))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">
            {cf.noEntries}
          </p>
        )}
      </div>
    </div>
  );
}

function DebtEditor({
  items,
  onChange,
}: {
  items: DebtItem[];
  onChange: (next: DebtItem[]) => void;
}) {
  const { t } = useLanguage();
  const cf = t.cashFlowStudio;
  const freqs: { v: CashFlowFrequency; l: string }[] = useMemo(
    () => [
      { v: "monthly", l: cf.freqMonthly },
      { v: "yearly", l: cf.freqYearly },
      { v: "one-time", l: cf.freqOneTime },
    ],
    [cf.freqMonthly, cf.freqYearly, cf.freqOneTime],
  );

  const patch = (id: string, patch: Partial<DebtItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white/90">{cf.debtPayments}</h3>
        <Button
          type="button"
          variant="ghost"
          className="gap-1 text-xs text-sky-300 hover:bg-white/5 hover:text-sky-200"
          onClick={() =>
            onChange([
              ...items,
              {
                id: newId(),
                name: cf.newDebt,
                amount: 0,
                frequency: "monthly",
              },
            ])
          }
        >
          <Plus className="h-3.5 w-3.5" />
          {cf.add}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((row) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-xl border border-white/5 bg-black/20 p-3 md:grid-cols-[1fr_0.6fr_0.6fr_0.7fr_auto] md:items-end"
          >
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelName}</Label>
              <Input
                value={row.name}
                onChange={(e) => patch(row.id, { name: e.target.value })}
                className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelPayment}</Label>
              <BudgetNumberInput
                value={row.amount}
                onCommit={(n) => patch(row.id, { amount: n })}
                className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelPrincipal}</Label>
              <OptionalBudgetNumberInput
                value={row.principalOutstanding}
                onCommit={(n) => patch(row.id, { principalOutstanding: n })}
                className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                placeholder={cf.principalPlaceholder}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-500">{cf.labelFrequency}</Label>
              <Select
                value={row.frequency}
                onValueChange={(v) => patch(row.id, { frequency: v as CashFlowFrequency })}
              >
                <SelectTrigger className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-[#0f1624] dark:text-white">
                  {freqs.map((f) => (
                    <SelectItem key={f.v} value={f.v} className="focus:bg-white/10">
                      {f.l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pb-1">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-500 transition-colors touch-manipulation hover:bg-red-500/10 hover:text-red-300 active:bg-red-500/15"
                aria-label={cf.removeRow}
                onClick={() => onChange(items.filter((i) => i.id !== row.id))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CashFlowDashboard() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const cf = t.cashFlowStudio;
  const chartTooltipStyle = useMemo(
    () => ({
      background: theme === "dark" ? "#0f1624" : "#ffffff",
      border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(15,23,42,0.12)",
      borderRadius: 12,
      fontSize: 12,
    }),
    [theme],
  );
  const chartTooltipLabel = useMemo(
    () => ({ color: theme === "dark" ? "#e2e8f0" : "#0f172a" }),
    [theme],
  );

  const catRows: { v: ExpenseCategory; l: string }[] = useMemo(
    () => [
      { v: "housing", l: cf.catHousing },
      { v: "food", l: cf.catFood },
      { v: "transport", l: cf.catTransport },
      { v: "subscriptions", l: cf.catSubscriptions },
      { v: "other", l: cf.catOther },
    ],
    [cf],
  );

  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserFinancialProfile | null>(null);
  const [scenario, setScenario] = useState<CashFlowScenario>({
    enabledPurchase: false,
    purchaseAmount: 1200,
    purchaseLabel: "Planned purchase",
    enabledIncomeShock: false,
    incomeDropPercent: 10,
  });

  const [incomeGrowth, setIncomeGrowth] = useState(3);
  const [expenseInflation, setExpenseInflation] = useState(2);

  const [aiResult, setAiResult] = useState<CashFlowAIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [engineProfile, setEngineProfile] = useState<UserFinancialProfile | null>(null);
  const [pendingRecalc, setPendingRecalc] = useState(false);
  const engineSyncedRef = useRef(false);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !profile) return;
    const timer = window.setTimeout(() => saveProfile(profile), 450);
    return () => window.clearTimeout(timer);
  }, [profile, ready]);

  useEffect(() => {
    if (!profile) return;
    if (!engineSyncedRef.current) {
      setEngineProfile(profile);
      engineSyncedRef.current = true;
      setPendingRecalc(false);
      return;
    }
    setPendingRecalc(true);
    const t = window.setTimeout(() => {
      setEngineProfile(profile);
      setPendingRecalc(false);
    }, 300);
    return () => window.clearTimeout(t);
  }, [profile]);

  const forecastParams = useMemo(
    () => ({
      months: 12,
      incomeGrowthAnnual: incomeGrowth / 100,
      expenseInflationAnnual: expenseInflation / 100,
      headlineInflationAnnual: expenseInflation / 100,
      scenario,
    }),
    [incomeGrowth, expenseInflation, scenario],
  );

  const engine = useMemo(() => {
    if (!engineProfile) return null;
    return runCashFlowEngine(engineProfile, forecastParams);
  }, [engineProfile, forecastParams]);

  const resetDemo = useCallback(() => {
    const next = createDefaultProfile();
    engineSyncedRef.current = true;
    setEngineProfile(next);
    setProfile(next);
    setAiResult(null);
    setAiError(null);
  }, []);

  const runAnalyze = useCallback(async () => {
    if (!profile || !engine) return;
    const strings = t.cashFlowStudio;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/cash-flow-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          forecast: forecastParams,
          enginePreview: engine,
          language,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.code === "MISSING_ANTHROPIC_KEY") {
          setAiError(strings.aiNotConfigured);
          return;
        }
        const raw = typeof data.error === "string" ? data.error : "";
        if (raw.includes("ANTHROPIC_API_KEY")) {
          setAiError(strings.aiNotConfigured);
          return;
        }
        setAiError(raw || strings.analyzeFailed);
        return;
      }
      if (data.result) setAiResult(data.result as CashFlowAIResult);
    } catch {
      setAiError(strings.networkError);
    } finally {
      setAiLoading(false);
    }
  }, [profile, engine, forecastParams, language, t]);

  if (!ready || !profile || !engine) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
      </div>
    );
  }

  const { metrics, forecast, risks, suggestions, categoryBreakdown, cardInsights } = engine;

  const chartData = forecast.map((p) => ({
    ...p,
    income: Math.round(p.income),
    expenses: Math.round(p.expenses),
    net: Math.round(p.net),
  }));

  const maxCat = Math.max(...Object.values(categoryBreakdown), 1);
  const breakdownBars = catRows.map((c) => ({
    key: c.v,
    label: c.l,
    value: categoryBreakdown[c.v],
    pct: metrics.monthlyIncome > 0 ? (categoryBreakdown[c.v] / metrics.monthlyIncome) * 100 : 0,
  }));

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden pb-8 text-slate-900 sm:space-y-8 sm:pb-16 dark:text-slate-100">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-sky-600/90 sm:text-xs dark:text-sky-400/90">{cf.kicker}</p>
          <h1 className="mt-2 text-[clamp(1.25rem,2vw+0.75rem,2.25rem)] font-semibold tracking-tight text-slate-900 md:text-4xl dark:text-white">
            {cf.title}
          </h1>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">{cf.subtitle}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="w-full touch-manipulation border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 sm:w-auto dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            onClick={resetDemo}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {cf.resetTemplate}
          </Button>
          <Button
            type="button"
            className="w-full touch-manipulation bg-gradient-to-r from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/25 hover:opacity-95 sm:w-auto"
            onClick={runAnalyze}
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Brain className="mr-2 h-4 w-4" />
            )}
            {aiLoading ? cf.thinking : cf.analyzeAi}
          </Button>
        </div>
      </header>

      {/* Summary */}
      <div
        className={`grid grid-cols-1 gap-3 transition-opacity duration-300 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4 ${
          pendingRecalc ? "opacity-[0.92]" : "opacity-100"
        }`}
      >
        {(
          [
            {
              label: cf.cardMonthlyIncome,
              value: metrics.monthlyIncome,
              icon: TrendingUp,
              hint: cf.cardMonthlyIncomeHint,
              positive: true,
              insightKey: "income" as const,
            },
            {
              label: cf.cardMonthlyExpenses,
              value: metrics.monthlyOperatingExpenses + metrics.monthlyDebtPayments,
              icon: ArrowDownRight,
              hint: cf.cardMonthlyExpensesHint,
              positive: false,
              insightKey: "expenses" as const,
            },
            {
              label: cf.cardNetCashFlow,
              value: metrics.netCashFlow,
              icon: metrics.netCashFlow >= 0 ? Wallet : ShieldAlert,
              hint: cf.cardNetCashFlowHint,
              positive: metrics.netCashFlow >= 0,
              insightKey: "net" as const,
            },
            {
              label: cf.cardSavingsRate,
              value: metrics.savingsRatePercent,
              icon: PiggyBank,
              hint: cf.cardSavingsRateHint,
              suffix: "%",
              isRate: true,
              positive: metrics.savingsRatePercent >= 10,
              insightKey: "savingsRate" as const,
            },
          ] as const
        ).map((card, i) => {
          const insight = cardInsights[card.insightKey];
          const display =
            "suffix" in card && card.suffix
              ? `${card.value.toFixed(1)}${card.suffix}`
              : money.format(Math.round(card.value as number));
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className={`${GLASS} group relative min-w-0 overflow-hidden p-4 sm:p-5`}
            >
              {insight && (
                <span
                  className={`absolute right-4 top-4 h-1.5 w-1.5 rounded-full ${
                    insight.level === "critical" ? "bg-red-500" : "bg-amber-400"
                  }`}
                  aria-hidden
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-sky-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="cursor-help text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-500">
                        {card.label}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent
                      sideOffset={6}
                      className="max-w-[240px] whitespace-pre-line border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-800 dark:border-white/10 dark:bg-[#0f1624] dark:text-slate-200"
                    >
                      {cardTooltipText(card.insightKey, engine, cf)}
                    </TooltipContent>
                  </Tooltip>
                  <motion.p
                    className={`mt-2 text-2xl font-semibold tabular-nums ${
                      "isRate" in card && card.isRate
                        ? card.positive
                          ? "text-emerald-600 dark:text-emerald-300"
                          : "text-rose-600 dark:text-rose-300"
                        : card.positive !== false && typeof card.value === "number" && card.value >= 0
                          ? "text-slate-900 dark:text-white"
                          : "text-rose-600 dark:text-rose-200"
                    }`}
                    key={display}
                    initial={{ opacity: 0.65 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {display}
                  </motion.p>
                  <p className="mt-2 text-[11px] leading-snug text-slate-600 dark:text-slate-500">{card.hint}</p>
                  {insight && (
                    <p
                      className={`mt-1 text-[10px] leading-snug ${
                        insight.level === "critical" ? "text-red-400/90" : "text-amber-400/90"
                      }`}
                    >
                      {cardInsightHint(insight.code, insight.params, cf)}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-sky-600 dark:border-white/10 dark:bg-white/5 dark:text-sky-300">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${GLASS} min-w-0 p-4 sm:p-5 xl:col-span-2`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{cf.chartTitle}</h2>
              <p className="text-xs text-slate-600 dark:text-slate-500">
                {tpl(cf.chartSubtitle, { ig: incomeGrowth, ee: expenseInflation })}
              </p>
            </div>
          </div>
          <div className="h-[240px] w-full min-w-0 sm:h-[280px] md:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}k`}
                />
                <RechartsTooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabel}
                  formatter={(value, name) => [
                    money.format(Number(value ?? 0)),
                    String(name ?? ""),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name={cf.chartLegendIncome}
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name={cf.chartLegendOutflows}
                  stroke="#fb7185"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 h-[100px] w-full min-w-0 sm:h-[120px] md:h-[140px]">
            <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-500">{cf.chartNetTrajectory}</p>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="label" hide />
                <YAxis hide />
                <RechartsTooltip contentStyle={chartTooltipStyle} formatter={(v) => money.format(Number(v ?? 0))} />
                <Area
                  type="monotone"
                  dataKey="net"
                  stroke="#c4b5fd"
                  fill="url(#netFill)"
                  strokeWidth={2}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${GLASS} flex min-w-0 flex-col p-4 sm:p-5`}
        >
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{cf.breakdownTitle}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-500">{cf.breakdownHint}</p>
          <div className="mt-4 flex flex-1 flex-col gap-3">
            {breakdownBars.map((b) => (
              <div key={b.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{b.label}</span>
                  <span className="tabular-nums text-slate-400">
                    {money.format(Math.round(b.value))}{" "}
                    <span className="text-slate-600">
                      ({b.pct.toFixed(0)}% {cf.pctOfIncome})
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500/80 to-violet-500/80"
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.value / maxCat) * 100}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
        <section className={`${GLASS} min-w-0 p-4 sm:p-5`}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{cf.scenarioTitle}</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">{cf.scenarioHint}</p>
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{cf.scenarioBuyTitle}</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">{cf.scenarioBuySub}</p>
              </div>
              <Switch
                checked={scenario.enabledPurchase}
                onCheckedChange={(v) => setScenario((s) => ({ ...s, enabledPurchase: v }))}
              />
            </div>
            <AnimatePresence>
              {scenario.enabledPurchase && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label className="text-slate-400">{cf.scenarioBuyLabelField}</Label>
                  <Input
                    value={scenario.purchaseLabel}
                    onChange={(e) =>
                      setScenario((s) => ({ ...s, purchaseLabel: e.target.value }))
                    }
                    className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <Label className="text-slate-400">{cf.scenarioBuyAmountField}</Label>
                  <BudgetNumberInput
                    value={scenario.purchaseAmount}
                    onCommit={(n) => setScenario((s) => ({ ...s, purchaseAmount: n }))}
                    className="border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{cf.scenarioIncomeDropTitle}</p>
                <p className="text-xs text-slate-600 dark:text-slate-500">{cf.scenarioIncomeDropSub}</p>
              </div>
              <Switch
                checked={scenario.enabledIncomeShock}
                onCheckedChange={(v) => setScenario((s) => ({ ...s, enabledIncomeShock: v }))}
              />
            </div>
            {scenario.enabledIncomeShock && (
              <div className="space-y-3 rounded-xl border border-white/5 bg-black/15 p-4">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{cf.scenarioIncomeShockLabel}</span>
                  <span className="tabular-nums text-slate-900 dark:text-white">{scenario.incomeDropPercent}%</span>
                </div>
                <Slider
                  min={0}
                  max={40}
                  step={1}
                  value={[scenario.incomeDropPercent]}
                  onValueChange={([v]) =>
                    setScenario((s) => ({ ...s, incomeDropPercent: v ?? 0 }))
                  }
                />
              </div>
            )}

            <div className="space-y-4 rounded-xl border border-white/5 bg-black/15 p-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{cf.scenarioIncomeGrowth}</span>
                  <span className="text-slate-900 dark:text-white">{incomeGrowth}%</span>
                </div>
                <Slider
                  min={0}
                  max={12}
                  step={0.5}
                  value={[incomeGrowth]}
                  onValueChange={([v]) => setIncomeGrowth(v ?? 0)}
                />
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{cf.scenarioExpenseInflation}</span>
                  <span className="text-slate-900 dark:text-white">{expenseInflation}%</span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={[expenseInflation]}
                  onValueChange={([v]) => setExpenseInflation(v ?? 0)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`${GLASS} min-w-0 p-4 sm:p-5`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{cf.signalsTitle}</h2>
          </div>
          <div className="mt-4 space-y-3">
            {risks.map((r) => (
              <div
                key={r.code}
                className="flex gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${severityDot(r.severity)}`} />
                <p className="text-sm leading-snug text-slate-600 dark:text-slate-300">{riskLine(r.code, r.params, cf)}</p>
              </div>
            ))}
            {risks.length === 0 && (
              <p className="text-sm text-slate-500">{cf.signalsEmpty}</p>
            )}
          </div>
          <div className="mt-6 border-t border-white/5 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-700 dark:text-slate-400">
              {cf.signalsHeuristics}
            </p>
            <ul className="mt-2 space-y-2">
              {suggestions.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-slate-800 dark:border-violet-500/15 dark:bg-violet-500/5 dark:text-slate-200"
                >
                  <span className="font-medium text-slate-900 dark:text-white">{suggestionTitle(s.id, cf)}</span>
                  <span className="text-slate-400"> — </span>
                  {suggestionDetail(s.id, s.params, cf)}
                </li>
              ))}
              {suggestions.length === 0 && (
                <li className="text-sm text-slate-600">{cf.heuristicsEmpty}</li>
              )}
            </ul>
          </div>
        </section>
      </div>

      <section className={`${GLASS} min-w-0 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{cf.claudeTitle}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-500">{cf.claudeHint}</p>
          </div>
          {aiResult && (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskColor(aiResult.riskLevel)}`}
            >
              {tpl(cf.claudeRiskBadge, {
                level: aiRiskLabel(aiResult.riskLevel, cf),
                conf: aiResult.confidenceScore,
              })}
            </span>
          )}
        </div>

        {aiError && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {aiError}
          </div>
        )}

        {aiResult && (
          <div className="mt-6 space-y-4">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{aiResult.summary}</p>
            {aiResult.immediatePriority && (
              <p className="text-xs leading-relaxed text-amber-200/85">{aiResult.immediatePriority}</p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-500">
                  {cf.keyProblems}
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {aiResult.keyProblems.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-500">
                  {cf.recommendations}
                </p>
                <ul className="mt-2 list-decimal space-y-1 pl-4 text-sm text-slate-600 dark:text-slate-300">
                  {aiResult.recommendations.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {!aiResult && !aiError && !aiLoading && (
          <p className="mt-6 text-sm text-slate-500">
            {cf.claudeEmptyBefore ? `${cf.claudeEmptyBefore} ` : null}
            <strong className="text-slate-700 dark:text-slate-300">{cf.claudeEmptyBold}</strong> {cf.claudeEmptyAfter}
          </p>
        )}
      </section>

      <section className={`${GLASS} min-w-0 p-4 sm:p-5`}>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{cf.workbook}</h2>
        <div className="space-y-8 pb-4 pr-1">
            <LineItemEditor
              title={cf.incomeSources}
              items={profile.income_sources}
              onChange={(next) => setProfile((p) => p && { ...p, income_sources: next })}
            />
            <LineItemEditor
              title={cf.fixedExpenses}
              items={profile.fixed_expenses}
              withCategory
              onChange={(next) => setProfile((p) => p && { ...p, fixed_expenses: next })}
            />
            <LineItemEditor
              title={cf.variableExpenses}
              items={profile.variable_expenses}
              withCategory
              onChange={(next) => setProfile((p) => p && { ...p, variable_expenses: next })}
            />
            <DebtEditor
              items={profile.debts}
              onChange={(next) => setProfile((p) => p && { ...p, debts: next })}
            />
            <LineItemEditor
              title={cf.savingsAllocations}
              items={profile.savings}
              onChange={(next) => setProfile((p) => p && { ...p, savings: next })}
            />
            <LineItemEditor
              title={cf.investments}
              items={profile.investments}
              onChange={(next) => setProfile((p) => p && { ...p, investments: next })}
            />
        </div>
      </section>
    </div>
  );
}