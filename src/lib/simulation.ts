import { calculateRisk, type AnalyzeAnswers, type AnalysisType } from "./scoring";
import type { Language } from "@/lib/translations";

export type ScenarioImpact = "LOW" | "MEDIUM" | "HIGH";

export type RiskScenario = {
  name: "income_drop" | "delay" | "default";
  impact: ScenarioImpact;
  risk: number;
  explanation: string;
};

export type SimulationResult = {
  worstCaseRisk: number;
  scenarios: RiskScenario[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toImpact(delta: number): ScenarioImpact {
  if (delta >= 25) return "HIGH";
  if (delta >= 12) return "MEDIUM";
  return "LOW";
}

export function simulateScenarios(
  answers: AnalyzeAnswers,
  analysisType: AnalysisType,
  language: Language = "ru"
): SimulationResult {
  const base = calculateRisk(answers, analysisType, language).score;

  const incomeDropAnswers: AnalyzeAnswers = {
    ...answers,
    income: Math.max(0, Math.round((answers.income ?? 0) * 0.7)),
  };
  const incomeDropRisk = calculateRisk(incomeDropAnswers, analysisType, language).score;

  const delayAnswers: AnalyzeAnswers = {
    ...answers,
    deadline: Math.max(0, Math.round((answers.deadline ?? 0) + 15)),
  };
  const delayRisk = calculateRisk(delayAnswers, analysisType, language).score;

  // Default-style stress: no contract / no docs / no collateral-like protection.
  const defaultAnswers: AnalyzeAnswers = {
    ...answers,
    contract: false,
    documentation_completeness: "none",
    stable_income_proof: "none",
    penalty_terms_present: false,
    collateral_provided: false,
  };
  const defaultRisk = calculateRisk(defaultAnswers, analysisType, language).score;

  const scenarios: RiskScenario[] = [
    {
      name: "income_drop",
      impact: toImpact(incomeDropRisk - base),
      risk: clamp(incomeDropRisk, 0, 100),
      explanation:
        language === "en"
          ? "If income falls by 30%, repayment pressure rises materially and buffer quality becomes more important."
          : language === "uz"
            ? "Agar daromad 30% ga tushsa, to'lov bosimi sezilarli oshadi va zaxira sifati muhimlashadi."
            : "Если доход снизится на 30%, нагрузка на погашение заметно возрастет и роль финансового буфера станет критичнее.",
    },
    {
      name: "delay",
      impact: toImpact(delayRisk - base),
      risk: clamp(delayRisk, 0, 100),
      explanation:
        language === "en"
          ? "A 15-day delay stretches exposure window and can increase uncertainty around fulfillment and repayment timing."
          : language === "uz"
            ? "15 kunlik kechikish risk oynasini uzaytiradi va bajarilish/to'lov muddati bo'yicha noaniqlikni oshiradi."
            : "Задержка на 15 дней увеличивает окно неопределенности и повышает риск сбоев по срокам исполнения/платежей.",
    },
    {
      name: "default",
      impact: toImpact(defaultRisk - base),
      risk: clamp(defaultRisk, 0, 100),
      explanation:
        language === "en"
          ? "In a default-like environment (no enforceable protections), recovery probability drops and losses can accelerate."
          : language === "uz"
            ? "Defoltga o'xshash holatda (majburiy himoya yo'q), qaytarish ehtimoli tushadi va yo'qotish tezlashadi."
            : "В дефолтном сценарии (без исполнимых защитных условий) вероятность возврата падает, а потери растут быстрее.",
    },
  ];

  return {
    worstCaseRisk: Math.max(...scenarios.map((s) => s.risk)),
    scenarios,
  };
}

