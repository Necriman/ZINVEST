import React from "react";
import { motion } from "framer-motion";

export type RiskResult = {
  risk: number;
  verdict: string;
  confidence: number;
  reasons: string[];
};

function getVerdictMeta(verdict: string) {
  const v = verdict.toUpperCase();
  if (v.includes("HIGH")) {
    return {
      tone: "high" as const,
      barFrom: "from-red-500",
      barTo: "to-red-400",
      box: "border-red-500/30 bg-red-500/10",
      title: "text-red-200",
    };
  }
  if (v.includes("MEDIUM")) {
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
            Risk: <span className="text-white font-medium">{pct}%</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <p className="text-xs text-slate-400">Confidence</p>
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
          <p className="text-sm font-semibold text-slate-200 mb-3">Reasons</p>
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
    </motion.div>
  );
}

