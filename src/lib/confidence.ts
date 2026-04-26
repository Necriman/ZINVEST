import type { AnalyzeAnswers } from "./scoring";

export type ConfidenceInput = {
  answers: Partial<AnalyzeAnswers>;
  contradictionsCount: number;
  inconsistentData: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function calculateConfidence(input: ConfidenceInput): number {
  const { answers, contradictionsCount, inconsistentData } = input;
  let confidence = 100;

  const requiredChecks: Array<boolean> = [
    Number.isFinite(Number(answers.amount)),
    Number.isFinite(Number(answers.income)),
    typeof answers.contract === "boolean",
    answers.relationship === "known" || answers.relationship === "unknown",
    Number.isFinite(Number(answers.deadline)),
    typeof answers.urgency === "string",
    typeof answers.transparency === "string",
  ];

  const missingAnswers = requiredChecks.filter((ok) => !ok).length;
  if (missingAnswers > 0) confidence -= 20;
  if (contradictionsCount > 0) confidence -= 15;
  if (inconsistentData) confidence -= 20;

  // Extra reduction if too many optional fields are absent.
  const optionalChecks: Array<boolean> = [
    typeof answers.documentation_completeness === "string",
    typeof answers.stable_income_proof === "string",
    Number.isFinite(Number(answers.savings)),
  ];
  const optionalMissing = optionalChecks.filter((ok) => !ok).length;
  confidence -= optionalMissing * 4;

  return clamp(Math.round(confidence), 0, 100);
}

