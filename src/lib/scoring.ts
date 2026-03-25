export type RiskRelationship = "known" | "unknown";

export type RiskInputData = {
  amount: number;
  income: number;
  contract: boolean;
  relationship: RiskRelationship;
  deadline: number;
};

export type AnalysisType =
  | "loan"
  | "installment"
  | "purchase"
  | "order"
  | "invest"
  | "longterm_invest";

export type AnalyzeAnswers = RiskInputData & {
  // Counterparty / deal structure extras
  contract_reason?: "verbal" | "missing_terms" | "not_sure";
  identity_verified?: "verified" | "partial" | "not_verified";
  past_defaults?: "never" | "once" | "many";
  transparency?: "high" | "medium" | "low";
  urgency?: "low" | "medium" | "high";

  // Scenario-specific deal fields
  collateral_provided?: boolean; // loan
  penalty_terms_present?: boolean; // installment
  delivery_reliability?: "reliable" | "uncertain" | "unknown"; // purchase/order
  guaranteed_return?: boolean; // invest

  // User financials extras
  savings?: number;
  repayment_plan?: "conservative" | "moderate" | "aggressive";
};

export type RiskScoringResult = {
  score: number;
  verdict: string;
  confidence: number;
  reasons: string[];
  dealRiskScore: number;
  userCapacityScore: number;
};

import type { Language } from "@/lib/translations";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function t<T>(language: Language, ru: T, en: T, uz: T): T {
  if (language === "ru") return ru;
  if (language === "en") return en;
  return uz;
}

export function calculateRisk(
  answers: AnalyzeAnswers,
  analysisType: AnalysisType,
  language: Language = "ru"
): RiskScoringResult {
  const reasons: string[] = [];

  // -----------------------
  // Deal risk (counterparty + terms)
  // -----------------------
  const dealFactors: Array<{
    id: string;
    weight: number;
    riskValue: number; // 0..100
    reason: { up: string; down: string };
    hard?: boolean;
  }> = [];

  const contractRisk = answers.contract ? 0 : 65;
  dealFactors.push({
    id: "contract",
    weight: 0.22,
    riskValue: contractRisk,
    reason: {
      up: t(language, "Нет письменного договора/соглашения повышает риск", "No formal contract increases risk", "Yozma shartnoma yo'qligi xavfni oshiradi"),
      down: t(language, "Есть письменный договор/соглашение снижает риск", "Formal contract exists and reduces risk", "Yozma shartnoma mavjud bo'lib, xavfni kamaytiradi"),
    },
    hard: !answers.contract,
  });

  const relationshipRisk = answers.relationship === "unknown" ? 55 : 10;
  dealFactors.push({
    id: "relationship",
    weight: 0.18,
    riskValue: relationshipRisk,
    reason: {
      up: t(language, "Контрагент не знаком повышает риск", "Unknown counterparty increases risk", "Hamkor noma'lum bo'lsa xavf oshadi"),
      down: t(language, "Контрагент вам знаком снижает риск", "Known counterparty reduces risk", "Hamkor sizga tanish bo'lsa xavf kamayadi"),
    },
  });

  if (!answers.contract) {
    const cr = answers.contract_reason ?? "not_sure";
    const contractReasonRisk =
      cr === "verbal" ? 75 : cr === "missing_terms" ? 60 : 55;
    dealFactors.push({
      id: "contract_reason",
      weight: 0.1,
      riskValue: contractReasonRisk,
      reason: {
        up: t(language, "Нет ясных письменных условий по сделке — повышенный риск", "Missing clear written terms — increased risk", "Bitim bo'yicha aniq yozma shartlar yo'q — xavf yuqori"),
        down: t(language, "Хотя договора нет, условия понятны и подтверждаемы", "Even without a contract, terms are understandable/confirmed", "Shartnoma bo'lmasa ham, shartlar tushunarli/ tasdiqlangan"),
      },
    });
  }

  if (answers.relationship === "unknown") {
    const v = answers.identity_verified ?? "not_verified";
    const identityRisk = v === "verified" ? 0 : v === "partial" ? 25 : 65;
    dealFactors.push({
      id: "identity_verified",
      weight: 0.12,
      riskValue: identityRisk,
      reason: {
        up: t(language, "Личность/данные контрагента подтверждены слабо — риск выше", "Weak identity/document verification increases risk", "Shaxs/hujjatlar yetarli tasdiqlanmagan — xavf yuqori"),
        down: t(language, "Проверка личности/данных контрагента снижает риск", "Identity/document verification reduces risk", "Tasdiqlash xavfni kamaytiradi"),
      },
    });
  }

  {
    const pd = answers.past_defaults ?? "once";
    const pastRisk = pd === "never" ? 0 : pd === "once" ? 30 : 72;
    dealFactors.push({
      id: "past_defaults",
      weight: 0.12,
      riskValue: pastRisk,
      reason: {
        up: t(language, "Были просрочки/неплатежи в прошлом — риск выше", "Past late payments/defaults increase risk", "Oldingi kechikish/to'lamaslik xavfni oshiradi"),
        down: t(language, "История погашений без проблем снижает риск", "Clean repayment history reduces risk", "Muammosiz qaytarish tarixi xavfni kamaytiradi"),
      },
    });
  }

  {
    const tr = answers.transparency ?? "medium";
    const transparencyRisk = tr === "high" ? 0 : tr === "medium" ? 25 : 60;
    dealFactors.push({
      id: "transparency",
      weight: 0.1,
      riskValue: transparencyRisk,
      reason: {
        up: t(language, "Низкая прозрачность условий повышает риск", "Low transparency of terms increases risk", "Kam shaffof shartlar xavfni oshiradi"),
        down: t(language, "Прозрачность условий снижает риск", "Transparent terms reduce risk", "Shartlarning shaffofligi xavfni kamaytiradi"),
      },
    });
  }

  {
    const u = answers.urgency ?? "medium";
    const urgencyRisk = u === "low" ? 0 : u === "medium" ? 25 : 65;
    dealFactors.push({
      id: "urgency",
      weight: 0.1,
      riskValue: urgencyRisk,
      reason: {
        up: t(language, "Сильное давление по срокам повышает риск", "High time pressure increases risk", "Muddat bosimi yuqori bo'lsa xavf oshadi"),
        down: t(language, "Нет жесткого срочного давления — риск ниже", "Low time pressure reduces risk", "Vaqt bosimi past bo'lsa xavf kamayadi"),
      },
      hard: u === "high",
    });
  }

  // Scenario-specific deal question
  const addScenarioFactor = () => {
    if (analysisType === "loan") {
      const ok = answers.collateral_provided === true;
      dealFactors.push({
        id: "collateral",
        weight: 0.08,
        riskValue: ok ? 0 : 42,
        reason: {
          up: t(language, "Нет обеспечения/залога повышает риск", "No collateral/guarantee increases risk", "Garanti/ta'minot yo'q — xavf yuqori"),
          down: t(language, "Есть обеспечение/залог снижает риск", "Collateral reduces risk", "Ta'minot xavfni kamaytiradi"),
        },
      });
    }
    if (analysisType === "installment") {
      const ok = answers.penalty_terms_present === true;
      dealFactors.push({
        id: "penalty_terms",
        weight: 0.08,
        riskValue: ok ? 0 : 28,
        reason: {
          up: t(language, "Нет прописанных штрафов/пенальти повышает риск", "No penalty terms increases risk", "Jarima/penalti shartlari yo'q — xavf yuqori"),
          down: t(language, "Есть штрафы/пенальти снижает риск", "Penalty terms reduce risk", "Jarima/penalti shartlari xavfni kamaytiradi"),
        },
      });
    }
    if (analysisType === "purchase" || analysisType === "order") {
      const dr = answers.delivery_reliability ?? "unknown";
      const risk = dr === "reliable" ? 0 : dr === "uncertain" ? 30 : 65;
      dealFactors.push({
        id: "delivery_reliability",
        weight: 0.08,
        riskValue: risk,
        reason: {
          up: t(language, "Надежность поставки/исполнения не подтверждена — риск выше", "Uncertain delivery/execution reliability increases risk", "Yetkazib berish/sifat ishonchliligi past — xavf yuqori"),
          down: t(language, "Надежность исполнения снижает риск", "Reliable execution reduces risk", "Ishonchli bajarish xavfni kamaytiradi"),
        },
      });
    }
    if (analysisType === "invest" || analysisType === "longterm_invest") {
      const gr = answers.guaranteed_return === true;
      dealFactors.push({
        id: "guaranteed_return",
        weight: 0.08,
        riskValue: gr ? 85 : 10,
        reason: {
          up: t(language, "Обещают гарантированную прибыль — это сильный красный флаг", "Guaranteed profit promise is a major red flag", "Kafolatlangan foyda va'dasi katta qizil bayroq"),
          down: t(language, "Нет обещаний гарантированной прибыли — риск ниже", "No guaranteed profit promise reduces risk", "Kafolatlangan foyda va'dasi yo'q — xavf past"),
        },
        hard: gr,
      });
    }
  };
  addScenarioFactor();

  const dealWeightSum = dealFactors.reduce((s, f) => s + f.weight, 0) || 1;
  const dealWeighted = dealFactors.reduce((s, f) => s + f.weight * clamp(f.riskValue, 0, 100), 0);
  let dealRiskScore = Math.round(dealWeighted / dealWeightSum);

  // Hard penalties
  if (!answers.contract) dealRiskScore = clamp(dealRiskScore + 12, 0, 100);
  if (analysisType === "invest" || analysisType === "longterm_invest") {
    if (answers.guaranteed_return === true) dealRiskScore = clamp(dealRiskScore + 20, 0, 100);
  }
  if (answers.urgency === "high") dealRiskScore = clamp(dealRiskScore + 15, 0, 100);

  // -----------------------
  // User capacity risk (ability to pay)
  // -----------------------
  const income = answers.income;
  const amount = answers.amount;
  const deadlineDays = answers.deadline;
  const ratio = income > 0 ? amount / income : Infinity;

  const amountRisk =
    ratio <= 0.3 ? 0 : ratio <= 0.5 ? 25 : ratio <= 0.8 ? 50 : 75;

  const deadlineRisk = deadlineDays >= 60 ? 0 : deadlineDays >= 30 ? 20 : deadlineDays >= 14 ? 45 : 75;

  const savings = answers.savings ?? 0;
  const savingsRisk =
    savings >= amount * 0.5 ? 0 : savings >= amount * 0.25 ? 20 : savings >= amount * 0.1 ? 45 : 70;

  const repaymentPlanRisk = (() => {
    if (!answers.repayment_plan) return 25;
    const rp = answers.repayment_plan;
    if (rp === "conservative") return 15;
    if (rp === "moderate") return 35;
    return 70;
  })();

  const userFactors: Array<{ weight: number; id: string; riskValue: number; up: string; down: string }> = [
    {
      id: "amount_income",
      weight: 0.45,
      riskValue: amountRisk,
      up: t(language, "Сумма заметно выше дохода — нагрузка выше", "Amount is noticeably higher than income — stress is higher", "Summa daromaddan sezilarli yuqori — yuk yuqori"),
      down: t(language, "Сумма в адекватной пропорции к доходу — нагрузка ниже", "Amount is in a reasonable proportion to income — lower stress", "Summa daromadga nisbatan yetarli — yuk pastroq"),
    },
    {
      id: "savings",
      weight: 0.25,
      riskValue: savingsRisk,
      up: t(language, "Накопления недостаточны для покрытия риска", "Savings are not enough to buffer risk", "Jamg'arma yetarli emas — risk yuqori"),
      down: t(language, "Накопления помогают пережить сложный период", "Savings help buffer a difficult period", "Jamg'arma qiyin davrni yengillashtiradi"),
    },
    {
      id: "deadline",
      weight: 0.25,
      riskValue: deadlineRisk,
      up: t(language, "Короткий горизонт погашения повышает риск", "Short payoff horizon increases risk", "To'lov ufqi qisqa — xavf yuqori"),
      down: t(language, "Достаточный горизонт снижает риск", "Sufficient horizon reduces risk", "Yetarli ufq xavfni kamaytiradi"),
    },
    {
      id: "repayment_plan",
      weight: 0.05,
      riskValue: repaymentPlanRisk,
      up: t(language, "План погашения уязвим при падении дохода", "Repayment plan is vulnerable if income drops", "Daromad tushsa, qaytarish rejasi zaif"),
      down: t(language, "План погашения с запасом снижает риск", "Conservative plan reduces risk", "Zaxirali reja xavfni kamaytiradi"),
    },
  ];

  const userWeightSum = userFactors.reduce((s, f) => s + f.weight, 0) || 1;
  const userWeighted = userFactors.reduce((s, f) => s + f.weight * clamp(f.riskValue, 0, 100), 0);
  let userCapacityScore = Math.round(userWeighted / userWeightSum);

  // -----------------------
  // Verdict
  // -----------------------
  const riskPercent = clamp(Math.round(dealRiskScore * 0.6 + userCapacityScore * 0.4), 0, 100);
  const verdict =
    riskPercent > 70
      ? t(language, "Высокий риск", "High risk", "Yuqori risk")
      : riskPercent > 50
        ? t(language, "Средний риск", "Medium risk", "O'rtacha risk")
        : t(language, "Низкий риск", "Low risk", "Kam risk");

  const recommendationPrefix = t(language, "Рекомендация: ", "Recommendation: ", "Tavsiya: ");
  const proceed =
    dealRiskScore > 70 && userCapacityScore > 70
      ? t(language, "Не приступать", "DO NOT PROCEED", "DO NOT PROCEED")
      : dealRiskScore > 50 || userCapacityScore > 50
        ? t(language, "Действуйте с осторожностью", "PROCEED WITH CAUTION", "Ehtiyot bilan davom eting")
        : t(language, "Безопасно продолжать", "SAFE TO PROCEED", "Xavfsiz davom eting");

  // Build explainable reasons
  const pushFactorReason = (riskValue: number, up: string, down: string) => {
    if (riskValue >= 50) reasons.push(up);
    else reasons.push(down);
  };

  for (const f of dealFactors) {
    pushFactorReason(f.riskValue, f.reason.up, f.reason.down);
  }

  for (const uf of userFactors) {
    pushFactorReason(uf.riskValue, uf.up, uf.down);
  }

  // Hard red flags
  if (!answers.contract) {
    reasons.unshift(
      `${recommendationPrefix}${proceed}`
    );
    reasons.unshift(
      t(language, "Красный флаг: нет письменного договора", "Red flag: no formal contract", "Qizil bayroq: yozma shartnoma yo'q")
    );
  } else if (analysisType === "invest" || analysisType === "longterm_invest") {
    if (answers.guaranteed_return === true) {
      reasons.unshift(
        `${recommendationPrefix}${proceed}`
      );
      reasons.unshift(
        t(language, "Красный флаг: обещают гарантированную прибыль", "Red flag: guaranteed profit promise", "Qizil bayroq: kafolatlangan foyda va'dasi")
      );
    }
  }

  // Ensure recommendation is present at the top exactly once if not already unshifted twice.
  const recStr = `${recommendationPrefix}${proceed}`;
  if (!reasons.includes(recStr)) reasons.unshift(recStr);

  // Confidence (deterministic): higher when both scores are far from 50.
  const scoreDistance = Math.abs(dealRiskScore - 50) + Math.abs(userCapacityScore - 50);
  const confidence = clamp(Math.round(60 + scoreDistance / 2), 55, 92);

  return {
    score: riskPercent,
    verdict,
    confidence,
    reasons,
    dealRiskScore,
    userCapacityScore,
  };
}

