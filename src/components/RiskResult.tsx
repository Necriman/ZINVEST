"use client";

import React from "react";
import { motion } from "framer-motion";
import type { RiskInputData } from "@/lib/scoring";
import type { Language } from "@/lib/translations";
import { useLanguage } from "@/lib/language-context";

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

export default function RiskResultCard({
  result,
  suppressCardMotion = false,
}: {
  result: RiskResult;
  /** Avoid double entrance animation when wrapped in a parent motion layer (e.g. modal). */
  suppressCardMotion?: boolean;
}) {
  const { t } = useLanguage();
  const meta = getVerdictMeta(result.verdict);
  const pct = Math.max(0, Math.min(100, Math.round(result.risk)));

  const rc = t.riskCard;
  const ui = {
    risk: rc.risk,
    confidence: rc.confidence,
    whyRisk: rc.whyRisk,
    considered: rc.considered,
    contract: rc.contract,
    counterparty: rc.counterparty,
    amount: rc.amount,
    income: rc.income,
    deadline: rc.deadline,
    days: rc.days,
    yes: rc.yes,
    no: rc.no,
    known: rc.known,
    unknown: rc.unknown,
    basedOnInputs: rc.basedOnInputs,
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
      initial={suppressCardMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={suppressCardMotion ? { duration: 0 } : { duration: 0.25 }}
      className={`rounded-2xl border ${meta.box} p-6`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className={`text-xl font-bold ${meta.title}`}>{result.verdict}</h2>
          <p className="text-sm text-slate-300 mt-1">
            {ui.risk}: <span className="text-white font-medium">{pct}%</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            {ui.confidence}: {Math.round(result.confidence)}% · {ui.basedOnInputs}
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
              <p className="text-sm text-white font-semibold">
                {result.inputData.deadline} {ui.days}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}

