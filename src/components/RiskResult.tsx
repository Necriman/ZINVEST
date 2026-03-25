import React from "react";
import { motion } from "framer-motion";
import type { RiskInputData } from "@/lib/scoring";
import type { Language } from "@/lib/translations";

export type RiskResult = {
  risk: number;
  verdict: string;
  confidence: number;
  reasons: string[];
  inputData?: RiskInputData;
  language?: Language;
};

function getVerdictMeta(verdict: string) {
  const v = verdict.toUpperCase();
  if (v.includes("ВЫСОК") || v.includes("HIGH") || v.includes("YUQORI")) {
    return {
      tone: "high" as const,
      barFrom: "from-red-500",
      barTo: "to-red-400",
      box: "border-red-500/30 bg-red-500/10",
      title: "text-red-200",
    };
  }
  if (v.includes("СРЕД") || v.includes("MEDIUM") || v.includes("ORTACHA") || v.includes("O'RTACHA")) {
    return {
      tone: "medium" as const,
      barFrom: "from-yellow-500",
      barTo: "to-yellow-400",
      box: "border-yellow-500/30 bg-yellow-500/10",
      title: "text-yellow-200",
    };
  }
  return {
    tone: "low" as const,
    barFrom: "from-emerald-500",
    barTo: "to-emerald-400",
    box: "border-emerald-500/30 bg-emerald-500/10",
    title: "text-emerald-200",
  };
}

export default function RiskResultCard({ result }: { result: RiskResult }) {
  const meta = getVerdictMeta(result.verdict);
  const pct = Math.max(0, Math.min(100, Math.round(result.risk)));

  const uiLang = result.language ?? "ru";
  const ui = {
    risk: uiLang === "en" ? "Risk" : uiLang === "uz" ? "Xavf" : "Риск",
    confidence:
      uiLang === "en" ? "Confidence" : uiLang === "uz" ? "Ishonch" : "Уверенность",
    whyRisk:
      uiLang === "en" ? "Why this risk" : uiLang === "uz" ? "Nega bunday xavf" : "Почему такой риск",
    considered:
      uiLang === "en" ? "What we considered" : uiLang === "uz" ? "Nimalarni hisobga oldik" : "Что мы учли",
    contract:
      uiLang === "en" ? "Contract" : uiLang === "uz" ? "Shartnoma" : "Договор",
    counterparty:
      uiLang === "en" ? "Counterparty" : uiLang === "uz" ? "Hamkor" : "Контрагент",
    amount:
      uiLang === "en" ? "Amount" : uiLang === "uz" ? "Summa" : "Сумма",
    income:
      uiLang === "en" ? "Income" : uiLang === "uz" ? "Daromad" : "Доход",
    deadline:
      uiLang === "en" ? "Deadline" : uiLang === "uz" ? "Muddati" : "Срок",
    yes: uiLang === "en" ? "Yes" : uiLang === "uz" ? "Ha" : "Да",
    no: uiLang === "en" ? "No" : uiLang === "uz" ? "Yo'q" : "Нет",
    known: uiLang === "en" ? "Known" : uiLang === "uz" ? "Ma'lum" : "Известно",
    unknown: uiLang === "en" ? "Unknown" : uiLang === "uz" ? "Noma'lum" : "Неизвестно",
  };

  const contractLabel =
    typeof result.inputData?.contract === "boolean"
      ? result.inputData.contract
        ? ui.yes
        : ui.no
      : "—";

  const relationshipLabel =
    result.inputData?.relationship === "unknown"
      ? ui.unknown
      : result.inputData?.relationship === "known"
        ? ui.known
        : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border ${meta.box} p-6`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className={`text-xl font-bold ${meta.title}`}>{result.verdict}</h2>
          <p className="text-sm text-slate-300 mt-1">
            {ui.risk}: <span className="text-white font-medium">{pct}%</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {ui.confidence}: {Math.round(result.confidence)}% ·{" "}
            {uiLang === "en"
              ? "Based on your inputs"
              : uiLang === "uz"
                ? "Kiritgan ma'lumotlaringiz asosida"
                : "Итог по введенным данным"}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400">{ui.confidence}</p>
          <p className="text-lg text-white font-semibold">
            {Math.round(result.confidence)}%
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
            className={`h-full rounded-full bg-gradient-to-r ${meta.barFrom} ${meta.barTo}`}
          />
        </div>
      </div>

      {result.reasons?.length ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-200 mb-3">{ui.whyRisk}</p>
          <ul className="space-y-2">
            {result.reasons.map((r, idx) => (
              <li
                key={`${idx}-${r}`}
                className="text-sm text-slate-300 leading-relaxed flex gap-2"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/40" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.inputData ? (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-200 mb-3">{ui.considered}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">{ui.amount}</p>
              <p className="text-sm text-white font-semibold">{result.inputData.amount} USD</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">{ui.income}</p>
              <p className="text-sm text-white font-semibold">{result.inputData.income} USD</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">{ui.contract}</p>
              <p className="text-sm text-white font-semibold">{contractLabel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-400">{ui.counterparty}</p>
              <p className="text-sm text-white font-semibold">{relationshipLabel}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:col-span-2">
              <p className="text-xs text-slate-400">{ui.deadline}</p>
              <p className="text-sm text-white font-semibold">{result.inputData.deadline} дней</p>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

