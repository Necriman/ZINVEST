import type { AnalyzeAnswers } from "./scoring";

export type BehavioralRiskResult = {
  risk: number;
  drivers: string[];
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function evaluateBehavioralRisk(
  answers: Partial<AnalyzeAnswers>
): BehavioralRiskResult {
  let risk = 0;
  const drivers: string[] = [];

  if (answers.urgency === "high") {
    risk += 25;
    drivers.push("urgency_pressure");
  } else if (answers.urgency === "medium") {
    risk += 10;
  }

  if (answers.transparency === "low") {
    risk += 30;
    drivers.push("low_transparency");
  } else if (answers.transparency === "medium") {
    risk += 12;
  }

  if (answers.documentation_completeness === "none") {
    risk += 24;
    drivers.push("missing_documents");
  } else if (answers.documentation_completeness === "partial") {
    risk += 12;
  }

  if (answers.relationship === "unknown" && answers.identity_verified === "not_verified") {
    risk += 20;
    drivers.push("identity_avoidance");
  }

  // Mild nonlinear lift when multiple behavior red flags stack.
  if (drivers.length >= 2) {
    risk += 10 + (drivers.length - 2) * 5;
  }

  return { risk: clamp(risk, 0, 100), drivers };
}

