export type RiskRelationship = "known" | "unknown";

export type RiskInputData = {
  amount: number;
  income: number;
  contract: boolean;
  relationship: RiskRelationship;
  deadline: number;
};

export type RiskScoringResult = {
  score: number;
  verdict: string;
  confidence: number;
  reasons: string[];
};

export function calculateRisk(data: RiskInputData): RiskScoringResult {
  let risk = 0;
  let reasons: string[] = [];

  if (data.amount > data.income * 0.5) {
    risk += 30;
    reasons.push("Amount is too high compared to income");
  }

  if (!data.contract) {
    risk += 25;
    reasons.push("No contract involved");
  }

  if (data.relationship === "unknown") {
    risk += 30;
    reasons.push("Borrower is not trusted");
  }

  if (data.deadline < 30) {
    risk += 10;
    reasons.push("Short repayment deadline");
  }

  return {
    score: Math.min(risk, 100),
    verdict:
      risk > 70 ? "HIGH RISK" : risk > 40 ? "MEDIUM RISK" : "LOW RISK",
    confidence: 60 + Math.random() * 20,
    reasons,
  };
}

