import type { Language } from "@/lib/translations";

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
  // Overall risk (0..100) - what the UI currently renders.
  score: number;

  // Verdict label for UI coloring.
  verdict: string;

  // More explicit decision recommendation (kept separate to not break UI).
  verdictDetail: string;

  confidence: number;

  // UI explanation bullets.
  reasons: string[];

  // Split scores (0..100)
  dealRiskScore: number;
  userCapacityScore: number;

  // AI-ready explanation fields (also returned for deterministic fallback).
  keyRisks: string[];
  explanation: string;
  recommendations: string[];
  socialProof: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function t<T>(language: Language, ru: T, en: T, uz: T): T {
  if (language === "ru") return ru;
  if (language === "en") return en;
  return uz;
}

function scoreChoice(mapping: Record<string, number>, value: unknown, fallback: number) {
  const v = typeof value === "string" ? value : "";
  return Object.prototype.hasOwnProperty.call(mapping, v) ? mapping[v] : fallback;
}

function formatPct(n: number) {
  return `${Math.round(clamp(n, 0, 100))}%`;
}

function nonlinearAmountIncomePenalty(ratio: number) {
  if (!Number.isFinite(ratio) || ratio < 0) return 100;
  if (ratio <= 0.2) return 0;
  const x = (ratio - 0.2) / 0.6; // normalized
  return clamp(Math.round(100 * (1 - Math.exp(-x))), 0, 100);
}

function nonlinearSavingsPenalty(amount: number, savings: number) {
  const a = Math.max(0, amount);
  const s = Math.max(0, savings);
  if (a <= 0) return 0;

  const coverage = s / a; // 0..inf
  // coverage=0 => penalty ~high, coverage=0.5 => penalty near low.
  const x = (0.35 - coverage) / 0.25;
  const raw = 100 * (1 / (1 + Math.exp(-2.6 * x)) - 0.5) * 2; // ~0..100
  return clamp(Math.round(raw), 0, 100);
}

function nonlinearDeadlinePenalty(days: number) {
  if (!Number.isFinite(days) || days < 0) return 100;
  if (days >= 60) return 0;
  if (days <= 10) return 85;
  if (days <= 14) return 70;
  if (days <= 21) return 45;
  if (days <= 30) return 25;
  return 10;
}

function uniquePush(arr: string[], value: string) {
  if (value && !arr.includes(value)) arr.push(value);
}

export function calculateRisk(
  answers: AnalyzeAnswers,
  analysisType: AnalysisType,
  language: Language = "ru"
): RiskScoringResult {
  const dealFactors: Array<{
    id: string;
    weight: number;
    riskValue: number; // 0..100
    whyBad: string;
    whyGood: string;
  }> = [];

  const redFlags: Array<{ id: string; severity: number; message: string }> = [];

  const contract = answers.contract;
  const contractRisk = contract ? 0 : 65;
  dealFactors.push({
    id: "contract",
    weight: 0.22,
    riskValue: contractRisk,
    whyBad: t(
      language,
      "Отсутствие письменного договора повышает юридический риск и неопределенность условий.",
      "No written contract increases legal risk and uncertainty.",
      "Yozma shartnoma yo'qligi huquqiy riskni oshiradi va shartlar noaniq bo'ladi."
    ),
    whyGood: t(
      language,
      "Письменный договор фиксирует обязанности и снижает риск споров.",
      "A written contract clarifies obligations and reduces dispute risk.",
      "Yozma shartnoma majburiyatlarni aniq belgilaydi va nizolar riskini kamaytiradi."
    ),
  });

  const relationshipRisk = answers.relationship === "unknown" ? 55 : 10;
  dealFactors.push({
    id: "relationship",
    weight: 0.18,
    riskValue: relationshipRisk,
    whyBad: t(
      language,
      "Неизвестный контрагент повышает риск мошенничества и несоответствий.",
      "Unknown counterparty increases fraud/mismatch risk.",
      "Noma'lum hamkor firib/mos kelmaslik xavfini oshiradi."
    ),
    whyGood: t(
      language,
      "Если контрагент вам знаком, вероятность проблем обычно ниже.",
      "A known counterparty typically lowers risk.",
      "Tanish hamkor odatda riskni kamaytiradi."
    ),
  });

  if (!contract) {
    const cr = answers.contract_reason ?? "not_sure";
    const contractReasonRisk =
      cr === "verbal" ? 75 : cr === "missing_terms" ? 60 : 55;

    dealFactors.push({
      id: "contract_reason",
      weight: 0.1,
      riskValue: contractReasonRisk,
      whyBad: t(
        language,
        "Причина отсутствия договора указывает на слабую формализацию сделки.",
        "The reason for missing documentation signals weak deal formalization.",
        "Shartnomaning yo'qligi sababi bitimning zaif rasmiylashtirilganini ko'rsatadi."
      ),
      whyGood: t(
        language,
        "Даже без договора, условия понятны и подтверждаются фактами — риск ниже.",
        "Even without a contract, clear terms can reduce risk if supported by evidence.",
        "Shartnomasiz ham shartlar tushunarli va dalillar bilan tasdiqlansa — risk pastroq."
      ),
    });
  }

  if (answers.relationship === "unknown") {
    const v = answers.identity_verified ?? "not_verified";
    const identityRisk = scoreChoice({ verified: 0, partial: 25, not_verified: 65 }, v, 65);
    dealFactors.push({
      id: "identity_verified",
      weight: 0.12,
      riskValue: identityRisk,
      whyBad: t(
        language,
        "Личность/данные контрагента подтверждены слабо — обязательства сложнее проверить.",
        "Weak identity/document verification makes obligations harder to validate.",
        "Shaxs/hujjatlar zaif tasdiqlangan — majburiyatlarni tekshirish qiyinroq."
      ),
      whyGood: t(
        language,
        "Проверка личности снижает риск мошенничества.",
        "Identity verification reduces fraud risk.",
        "Shaxsni tekshirish firib xavfini kamaytiradi."
      ),
    });
  }

  {
    const pd = answers.past_defaults ?? "once";
    const pastRisk = scoreChoice({ never: 0, once: 30, many: 72 }, pd, 55);
    dealFactors.push({
      id: "past_defaults",
      weight: 0.12,
      riskValue: pastRisk,
      whyBad: t(
        language,
        "Прошлые задержки/невозвраты — сильный индикатор будущего риска.",
        "Past delays/defaults are a strong indicator of future risk.",
        "Oldingi kechikish/to'lamaslik kelajakdagi riskning kuchli indikatori."
      ),
      whyGood: t(
        language,
        "История без проблем снижает ожидаемую вероятность срыва.",
        "A clean history lowers expected failure probability.",
        "Muammosiz tarix kutilayotgan xavfni kamaytiradi."
      ),
    });
  }

  {
    const tr = answers.transparency ?? "medium";
    const transparencyRisk = scoreChoice({ high: 0, medium: 25, low: 60 }, tr, 40);
    dealFactors.push({
      id: "transparency",
      weight: 0.1,
      riskValue: transparencyRisk,
      whyBad: t(
        language,
        "Низкая прозрачность условий повышает риск скрытых пунктов и несостыковок.",
        "Low transparency increases hidden-term and mismatch risk.",
        "Past shaffoflik yashirin bandlar va nomuvofiqlik riskini oshiradi."
      ),
      whyGood: t(
        language,
        "Высокая прозрачность позволяет проверить обязательства до передачи денег.",
        "High transparency helps you verify obligations before transferring money.",
        "Yuqori shaffoflik pul o'tkazishdan oldin majburiyatlarni tekshirishga yordam beradi."
      ),
    });
  }

  {
    const u = answers.urgency ?? "medium";
    const urgencyRisk = scoreChoice({ low: 0, medium: 25, high: 65 }, u, 35);
    dealFactors.push({
      id: "urgency",
      weight: 0.1,
      riskValue: urgencyRisk,
      whyBad: t(
        language,
        "Сильное давление по срокам может быть признаком попытки обойти проверку.",
        "Strong deadline pressure can signal attempts to bypass checks.",
        "Kuchli muddat bosimi tekshiruvni chetlab o'tishga urinish bo'lishi mumkin."
      ),
      whyGood: t(
        language,
        "Нет жесткого срочного давления — у вас больше времени проверить детали.",
        "No harsh deadline pressure means you have time to verify details.",
        "Qattiq muddat bosimi bo'lmasa, detallarni tekshirishga vaqt bor."
      ),
    });
  }

  // Scenario-specific factors (still compatible with the existing UI fields).
  if (analysisType === "loan") {
    const collateralOk = answers.collateral_provided === true;
    const riskValue = collateralOk ? 0 : 42;
    dealFactors.push({
      id: "collateral_provided",
      weight: 0.08,
      riskValue,
      whyBad: t(
        language,
        "Нет залога/обеспечения — в проблемной ситуации возврат может быть сложнее.",
        "No collateral/guarantee can make recovery harder if problems occur.",
        "Garov/ta'minot yo'q bo'lsa, muammo chiqsa qaytarish qiyinlashadi."
      ),
      whyGood: t(
        language,
        "Обеспечение снижает тяжесть потерь и повышает дисциплину исполнения.",
        "Collateral reduces loss severity and improves execution discipline.",
        "Ta'minot zarar og'irligini kamaytiradi va bajarish intizomini oshiradi."
      ),
    });
  }

  if (analysisType === "installment") {
    const penaltiesOk = answers.penalty_terms_present === true;
    const riskValue = penaltiesOk ? 0 : 28;
    dealFactors.push({
      id: "penalty_terms_present",
      weight: 0.08,
      riskValue,
      whyBad: t(
        language,
        "Нет штрафов/пенальти — меньше стимул соблюдать сроки.",
        "No penalty terms reduces incentives to follow timelines.",
        "Jarima/penalti yo'qligi muddatga rioya qilish rag'batini kamaytiradi."
      ),
      whyGood: t(
        language,
        "Пенальти защищают интересы и укрепляют дисциплину исполнения.",
        "Penalties protect your interests and strengthen execution discipline.",
        "Jarimalar manfaatni himoya qiladi va bajarilish intizomini kuchaytiradi."
      ),
    });
  }

  if (analysisType === "purchase" || analysisType === "order") {
    const dr = answers.delivery_reliability ?? "unknown";
    const riskValue = dr === "reliable" ? 0 : dr === "uncertain" ? 30 : 65;
    dealFactors.push({
      id: "delivery_reliability",
      weight: 0.08,
      riskValue,
      whyBad: t(
        language,
        "Надежность поставки/исполнения не подтверждена — выше риск задержек и несоответствий.",
        "Execution reliability is not confirmed — higher delay/mismatch risk.",
        "Bajarilish ishonchliligi tasdiqlanmagan — kechikish va mos kelmaslik xavfi yuqori."
      ),
      whyGood: t(
        language,
        "Надежное исполнение снижает риск заплатить и не получить результат.",
        "Reliable execution lowers risk of paying and not receiving results.",
        "Ishonchli bajarilish to'lovdan keyin natija bo'lmasligi ehtimolini kamaytiradi."
      ),
    });
  }

  if (analysisType === "invest" || analysisType === "longterm_invest") {
    const gr = answers.guaranteed_return === true;
    const riskValue = gr ? 85 : 10;
    dealFactors.push({
      id: "guaranteed_return",
      weight: 0.08,
      riskValue,
      whyBad: t(
        language,
        "Обещают гарантированную прибыль — это сильный красный флаг.",
        "Guaranteed profit promise is a strong red flag.",
        "Kafolatlangan foyda va'dasi — kuchli qizil bayroq."
      ),
      whyGood: t(
        language,
        "Если нет обещаний гарантированной прибыли, реальность рисков оценивать проще.",
        "Without guaranteed-profit promises, it’s easier to assess real risks.",
        "Kafolatlangan foyda va'dasi bo'lmasa, haqiqiy riskni baholash osonroq."
      ),
    });
  }

  // Weighted deal risk.
  const dealWeightSum = dealFactors.reduce((s, f) => s + f.weight, 0) || 1;
  const dealBase = dealFactors.reduce((s, f) => s + f.weight * clamp(f.riskValue, 0, 100), 0);
  let dealRiskScore = Math.round(dealBase / dealWeightSum);

  const pushDealFlag = (id: string, severity: number, message: string, active: boolean) => {
    if (active) redFlags.push({ id, severity, message });
  };

  pushDealFlag(
    "no_contract",
    40,
    t(language, "Красный флаг: нет письменного договора.", "Red flag: no written contract.", "Qizil bayroq: yozma shartnoma yo'q."),
    !answers.contract
  );
  pushDealFlag(
    "unknown_counterparty",
    25,
    t(language, "Красный флаг: контрагент неизвестен.", "Red flag: unknown counterparty.", "Qizil bayroq: hamkor noma'lum."),
    answers.relationship === "unknown"
  );
  pushDealFlag(
    "identity_not_verified",
    30,
    t(language, "Красный флаг: слабая верификация личности.", "Red flag: weak identity verification.", "Qizil bayroq: shaxs zaif tasdiqlangan."),
    answers.relationship === "unknown" &&
      (answers.identity_verified === "partial" || answers.identity_verified === "not_verified")
  );
  pushDealFlag(
    "past_defaults_many",
    35,
    t(language, "Красный флаг: множественные просрочки/невозвраты.", "Red flag: multiple past defaults.", "Qizil bayroq: ko'p marotaba kechikish/to'lamaslik."),
    answers.past_defaults === "many"
  );
  pushDealFlag(
    "low_transparency",
    25,
    t(language, "Красный флаг: низкая прозрачность документов и условий.", "Red flag: low transparency.", "Qizil bayroq: shaffoflik past."),
    answers.transparency === "low"
  );
  pushDealFlag(
    "urgency_high",
    30,
    t(language, "Красный флаг: сильное давление по срокам.", "Red flag: strong time pressure.", "Qizil bayroq: kuchli muddat bosimi."),
    answers.urgency === "high"
  );

  if (analysisType === "loan") {
    pushDealFlag(
      "no_collateral",
      20,
      t(language, "Красный флаг: нет обеспечения/залога.", "Red flag: no collateral/guarantee.", "Qizil bayroq: garov/ta'minot yo'q."),
      answers.collateral_provided === false
    );
  }
  if (analysisType === "installment") {
    pushDealFlag(
      "no_penalty_terms",
      15,
      t(language, "Красный флаг: нет штрафов/пенальти за просрочку.", "Red flag: no penalty terms.", "Qizil bayroq: jarima/penalti yo'q."),
      answers.penalty_terms_present === false
    );
  }
  if (analysisType === "purchase" || analysisType === "order") {
    pushDealFlag(
      "delivery_unreliable",
      25,
      t(language, "Красный флаг: надежность исполнения под вопросом.", "Red flag: execution reliability uncertain.", "Qizil bayroq: bajarilish ishonchliligi shubhali."),
      answers.delivery_reliability === "uncertain" || answers.delivery_reliability === "unknown"
    );
  }
  if (analysisType === "invest" || analysisType === "longterm_invest") {
    pushDealFlag(
      "guaranteed_return",
      50,
      t(language, "Красный флаг: обещают гарантированную прибыль.", "Red flag: guaranteed returns promised.", "Qizil bayroq: kafolatlangan foyda va'dasi."),
      answers.guaranteed_return === true
    );
  }

  const dealRedSum = redFlags.reduce((s, f) => s + f.severity, 0);
  if (dealRedSum > 0) {
    const redCount = redFlags.length;
    const amplification =
      1 +
      Math.min(0.9, dealRedSum / 180) +
      Math.min(0.4, (redCount - 1) * 0.12);
    dealRiskScore = clamp(Math.round(dealRiskScore + dealRedSum * amplification), 0, 100);
  }

  // -----------------------
  // User capacity risk
  // -----------------------
  const ratio = answers.income > 0 ? answers.amount / answers.income : Infinity;
  const amountRisk = nonlinearAmountIncomePenalty(ratio);
  const savingsRisk = nonlinearSavingsPenalty(answers.amount, answers.savings ?? 0);
  const deadlineRisk = nonlinearDeadlinePenalty(answers.deadline);
  const repaymentPlanRisk = (() => {
    const rp = answers.repayment_plan;
    if (!rp) return 35;
    if (rp === "conservative") return 15;
    if (rp === "moderate") return 35;
    return 70;
  })();

  const userFactors = [
    { weight: 0.45, riskValue: amountRisk },
    { weight: 0.25, riskValue: savingsRisk },
    { weight: 0.25, riskValue: deadlineRisk },
    { weight: 0.05, riskValue: repaymentPlanRisk },
  ];
  const userWeightSum = userFactors.reduce((s, f) => s + f.weight, 0) || 1;
  const userBase = userFactors.reduce((s, f) => s + f.weight * clamp(f.riskValue, 0, 100), 0);
  let userCapacityScore = Math.round(userBase / userWeightSum);

  // User red flags (capacity)
  const userRedFlags: number[] = [];
  if (ratio >= 1.0) userRedFlags.push(35);
  if (answers.deadline < 14) userRedFlags.push(30);
  if ((answers.savings ?? 0) < answers.amount * 0.1) userRedFlags.push(25);
  if (answers.repayment_plan === "aggressive") userRedFlags.push(20);

  if (userRedFlags.length) {
    const sum = userRedFlags.reduce((s, x) => s + x, 0);
    const amplification = 1 + Math.min(0.9, sum / 220) + Math.min(0.35, (userRedFlags.length - 1) * 0.1);
    userCapacityScore = clamp(Math.round(userCapacityScore + sum * amplification), 0, 100);
  }

  const overallRisk = clamp(Math.round(dealRiskScore * 0.6 + userCapacityScore * 0.4), 0, 100);

  const verdict = overallRisk > 70
    ? t(language, "Высокий риск", "High risk", "Yuqori risk")
    : overallRisk > 50
      ? t(language, "Средний риск", "Medium risk", "O'rtacha risk")
      : t(language, "Низкий риск", "Low risk", "Kam risk");

  const verdictDetail = (() => {
    if (dealRiskScore > 70 && userCapacityScore > 70) {
      return t(language, "DO NOT PROCEED", "DO NOT PROCEED", "DO NOT PROCEED");
    }
    if (dealRiskScore > 50 || userCapacityScore > 50) {
      return t(language, "PROCEED WITH CAUTION", "PROCEED WITH CAUTION", "Ehtiyot bilan davom eting");
    }
    return t(language, "SAFE TO PROCEED", "SAFE TO PROCEED", "Xavfsiz davom eting");
  })();

  // -----------------------
  // Deterministic explanation + recommendations (fallback for AI)
  // -----------------------
  const reasons: string[] = [];
  const keyRisks: string[] = [];

  const recommendationPrefix = t(language, "Рекомендация: ", "Recommendation: ", "Tavsiya: ");
  const proceedLine = `${recommendationPrefix}${verdictDetail}`;
  uniquePush(reasons, proceedLine);

  const sortedFlags = redFlags
    .slice()
    .sort((a, b) => b.severity - a.severity)
    .map((f) => f.message);
  for (const msg of sortedFlags.slice(0, 4)) uniquePush(reasons, msg);

  // Top factor-driven bullets (human-like).
  if (dealFactors.find((f) => f.id === "contract")?.riskValue && !answers.contract) {
    uniquePush(
      reasons,
      t(
        language,
        "Отсутствие договора означает, что у вас может не быть четкой правовой опоры при невыполнении обязательств.",
        "Without a contract, you may have less legal leverage if obligations are not met.",
        "Shartnomasiz majburiyat bajarilmasa sizning huquqiy ta'siringiz kamroq bo'lishi mumkin."
      )
    );
    uniquePush(keyRisks, t(language, "Нет договора = слабая юридическая защита.", "No contract = weaker legal protection.", "Shartnoma yo'q = huquqiy himoya zaif."));
  }

  if (answers.relationship === "unknown") {
    uniquePush(
      reasons,
      t(
        language,
        "Контрагент неизвестен: сложнее проверить реальность обещаний и предсказать поведение.",
        "Unknown counterparty: harder to validate claims and predict behavior.",
        "Hamkor noma'lum: va'dalarning real ekanini tekshirish va xatti-harakatni oldindan aytish qiyin."
      )
    );
    uniquePush(keyRisks, t(language, "Неизвестный контрагент повышает риск несоответствий.", "Unknown counterparty increases mismatch risk.", "Noma'lum hamkor mos kelmaslik riskini oshiradi."));
  }

  if ((answers.urgency ?? "medium") === "high") {
    uniquePush(
      reasons,
      t(
        language,
        "Сильное давление по срокам снижает качество проверки — это часто усиливает риск.",
        "High time pressure reduces verification quality — the risk rises.",
        "Kuchli muddat bosimi tekshiruv sifatini pasaytiradi — risk oshadi."
      )
    );
    uniquePush(keyRisks, t(language, "Срочное давление = меньше времени на проверку.", "Urgency pressure = less time for verification.", "Shoshilinch bosim = tekshiruv uchun kamroq vaqt."));
  }

  if ((analysisType === "invest" || analysisType === "longterm_invest") && answers.guaranteed_return === true) {
    uniquePush(
      reasons,
      t(
        language,
        "Обещают гарантированную прибыль: это один из самых частых паттернов мошеннических схем.",
        "Guaranteed profit promise: one of the most common scam patterns.",
        "Kafolatlangan foyda va'dasi: firib sxemalarining eng ko'p uchraydigan belgilaridan biri."
      )
    );
    uniquePush(keyRisks, t(language, "Гарантированная прибыль — ключевой красный флаг.", "Guaranteed returns are a key red flag.", "Kafolatlangan foyda — muhim qizil bayroq."));
  }

  // User capacity bullets.
  if (ratio >= 1.0) {
    uniquePush(
      reasons,
      t(
        language,
        "Сумма сделки близка или выше вашего дохода — при проблемах может быстро вырасти стресс по возврату.",
        "Deal size is close to or above your income — stress can rise quickly if issues appear.",
        "Bitim summasi daromadingizga yaqin yoki undan yuqori — muammo bo'lsa qaytarish stressi tez oshishi mumkin."
      )
    );
    uniquePush(keyRisks, t(language, "Размер относительно дохода высокий.", "High amount relative to income.", "Daromadga nisbatan summa yuqori."));
  }

  if ((answers.savings ?? 0) < answers.amount * 0.1) {
    uniquePush(
      reasons,
      t(
        language,
        "Накоплений мало: в неблагоприятном сценарии возможен кассовый разрыв.",
        "Low savings: an adverse scenario can create a cash gap.",
        "Jamg'arma kam: noqulay stsenariy pul yetishmasligiga olib kelishi mumkin."
      )
    );
    uniquePush(keyRisks, t(language, "Буфер слишком мал (savings).", "Savings buffer is too small.", "Zaxira (jamg'arma) juda kichik."));
  }

  if (answers.deadline < 14) {
    uniquePush(
      reasons,
      t(
        language,
        "Короткий горизонт платежей повышает вероятность давления по срокам.",
        "Short payment horizon increases deadline pressure likelihood.",
        "Qisqa to'lov ufqi muddat bosimini kuchaytiradi."
      )
    );
    uniquePush(keyRisks, t(language, "Короткий срок — давление выше.", "Short deadline increases pressure.", "Qisqa muddat bosimni oshiradi."));
  }

  // Recommendations (mitigations)
  const recommendations: string[] = [];
  const pushRec = (s: string) => {
    if (s && recommendations.length < 8 && !recommendations.includes(s)) recommendations.push(s);
  };

  if (!answers.contract) {
    pushRec(
      t(
        language,
        "Постарайтесь получить письменное соглашение с понятными условиями (сроки, ответственность, порядок возврата).",
        "Try to obtain a written agreement with clear terms (timelines, responsibility, repayment/refund process).",
        "Ayniq shartlar (muddatlar, mas'uliyat, qaytarish tartibi) bilan yozma kelishuvga harakat qiling."
      )
    );
  }

  if (answers.relationship === "unknown") {
    pushRec(
      t(
        language,
        "Проверьте контрагента: документы, регистрацию, репутацию и подтверждение личности.",
        "Verify the counterparty: documents, registration, reputation, and identity proof.",
        "Hamkorni tekshiring: hujjatlar, ro'yxat, obro' va shaxsni tasdiqlash dalillari."
      )
    );
  }

  if (answers.relationship === "unknown" && (answers.identity_verified === "partial" || answers.identity_verified === "not_verified")) {
    pushRec(
      t(
        language,
        "Снизьте риск: требуйте подтверждения личности/данных до передачи денег.",
        "Reduce risk: require identity/document verification before transferring money.",
        "Xavfni kamaytiring: pul o'tkazishdan oldin shaxs/hujjatni tasdiqlashni talab qiling."
      )
    );
  }

  if (answers.urgency === "high") {
    pushRec(
      t(
        language,
        "Уберите давление: возьмите время на проверку и фиксацию условий письменно.",
        "Remove pressure: take time to verify and document the terms in writing.",
        "Bosimni kamaytiring: tekshirishga vaqt ajrating va shartlarni yozma tarzda belgilang."
      )
    );
  }

  if ((analysisType === "invest" || analysisType === "longterm_invest") && answers.guaranteed_return === true) {
    pushRec(
      t(
        language,
        "Избегайте сделок с обещанием гарантированной прибыли без прозрачных доказательств и условий.",
        "Avoid deals promising guaranteed profit without transparent evidence and terms.",
        "Shaffof dalil va shartlarsiz kafolatlangan foyda va'da qilinadigan bitimlardan saqlaning."
      )
    );
  }

  if (analysisType === "loan" && answers.collateral_provided === false) {
    pushRec(
      t(
        language,
        "Если возможно, запросите обеспечение/залог или уменьшите сумму сделки.",
        "If possible, request collateral/guarantee or reduce the deal size.",
        "Imkon bo'lsa ta'minot/garov so'rang yoki bitim summasini kamaytiring."
      )
    );
  }

  if (analysisType === "installment" && answers.penalty_terms_present === false) {
    pushRec(
      t(
        language,
        "Добавьте в график ответственность: штрафы/пенальти за просрочку или эквивалентный механизм.",
        "Add accountability to the schedule: penalties/fees for overdue payments or an equivalent mechanism.",
        "Jadvalga mas'uliyat qo'shing: kechikish uchun jarimalar/penaltilar yoki shunga teng mexanizm."
      )
    );
  }

  if ((analysisType === "purchase" || analysisType === "order") && (answers.delivery_reliability === "uncertain" || answers.delivery_reliability === "unknown")) {
    pushRec(
      t(
        language,
        "Запросите подтверждения исполнения (SLA/сроки, документы, трекинг) и условия возврата/замены.",
        "Request execution confirmations (SLA/timelines, documents, tracking) and return/replacement terms.",
        "Bajarilishni tasdiqlovchi ma'lumotlarni (SLA/muddatlar, hujjatlar, tracking) va qaytarish/almashtirish shartlarini so'rang."
      )
    );
  }

  if (ratio >= 0.5 && answers.repayment_plan) {
    pushRec(
      t(
        language,
        "Сделайте сценарий устойчивым: выберите более консервативный план на случай снижения дохода.",
        "Harden the plan: choose a more conservative repayment scenario in case income drops.",
        "Rejani mustahkamlang: daromad tushsa uchun yanada konservativroq qaytarish rejasini tanlang."
      )
    );
  }

  if (!recommendations.length) {
    pushRec(
      t(
        language,
        "Подготовьте чек-лист условий и подтвердите ключевые пункты письменно.",
        "Prepare a conditions checklist and confirm key points in writing.",
        "Shartlar bo'yicha chek-list tuzing va asosiy bandlarni yozma tarzda tasdiqlang."
      )
    );
  }

  // Social proof (simulated)
  const lossRate = clamp(18 + (overallRisk * 0.35) + redFlags.length * 8, 12, 82);
  const socialProof = t(
    language,
    `По аналогичным кейсам: примерно ${formatPct(lossRate)} завершались финансовыми потерями, когда подобные красные флаги встречались вместе. Это ориентир для дисциплины проверки.`,
    `Based on similar cases: about ${formatPct(lossRate)} ended with financial loss when these red flags showed up together. This is a reason to verify more carefully.`,
    `O'xshash holatlarda: taxminan ${formatPct(lossRate)} moliyaviy yo'qotish bilan yakunlangan, qachon shu kabi qizil bayroqlar birga bo'lgan. Bu tekshiruv intizomi uchun signal.`
  );

  // Explanations
  const topDrivers = keyRisks.slice(0, 3).join(" ");
  const explanation = t(
    language,
    `Мы оценили риск сделки и вашу платежную устойчивость. Итоговый риск: ${overallRisk} из 100.\n\n${
      redFlags.length
        ? `Ключевые причины повышения риска: ${topDrivers || "несколько красных флагов"}.`
        : "По текущим данным крупных красных флагов не выявлено."
    }\n\nЧто это значит на практике: когда условия слабо формализованы и есть давление по срокам, растет шанс споров и невыполнения обязательств. Сильнее всего риск снижается, когда вы фиксируете ключевые условия письменно и проверяете реальность обещаний до передачи денег.\n\n${socialProof}`,
    `We assessed deal risk and your ability to absorb payment stress. Overall risk: ${overallRisk} out of 100.\n\n${
      redFlags.length
        ? `Main risk drivers: ${topDrivers || "multiple red flags"}.`
        : "Based on the provided data, major red flags were not detected."
    }\n\nIn practice, weakly documented terms and high time pressure increase the chance of disputes and non-performance. Risk drops most when you document key terms and validate claims before transferring money.\n\n${socialProof}`,
    `Biz bitim riskini va to'lov stressini yenga olish qobiliyatingizni baholadik. Umumiy risk: ${overallRisk} / 100.\n\n${
      redFlags.length
        ? `Asosiy sabablar: ${topDrivers || "bir nechta qizil bayroq"}.`
        : "Kiritilgan ma'lumotlar asosida katta qizil bayroqlar topilmadi."
    }\n\nAmaliy ma'nosi: shartlar yetarli rasmiylashtirilmagan va muddat bosimi bo'lsa, nizolar va majburiyatlarni bajarmaslik ehtimoli oshadi. Risk eng ko'p kamayadi, agar siz asosiy shartlarni yozma tarzda tasdiqlab, pul o'tkazishdan oldin va'dalarning real ekanini tekshirsangiz.\n\n${socialProof}`
  );

  // Confidence
  const missingOptionalCount = [
    answers.contract ? 0 : 0, // contract always answered
    // only required if contract === false
    !answers.contract ? (typeof answers.contract_reason === "string" ? 0 : 1) : 0,
    // only required if relationship === unknown
    answers.relationship === "unknown" ? (typeof answers.identity_verified === "string" ? 0 : 1) : 0,
    // optional depending on conditions
    ratio >= 0.5 || answers.urgency === "high" ? (typeof answers.repayment_plan === "string" ? 0 : 1) : 0,
  ].reduce((s, x) => s + x, 0);

  const scoreDistance = Math.abs(dealRiskScore - 50) + Math.abs(userCapacityScore - 50);
  const redFlagCount = redFlags.length;
  const confidence = clamp(Math.round(62 + scoreDistance / 3 + redFlagCount * 2 - missingOptionalCount * 6), 45, 94);

  // Keep reasons short for the UI.
  // Ensure social proof is present (as a "real feeling" signal).
  uniquePush(reasons, socialProof);
  const limitedReasons = reasons.slice(0, 10);

  // Derive keyRisks from both flags and recommendations.
  const enrichedKeyRisks = [...keyRisks];
  for (const k of sortedFlags.slice(0, 3)) uniquePush(enrichedKeyRisks, k);
  for (const r of recommendations.slice(0, 2)) uniquePush(enrichedKeyRisks, r);

  return {
    score: overallRisk,
    verdict,
    verdictDetail,
    confidence,
    reasons: limitedReasons,
    dealRiskScore,
    userCapacityScore,
    keyRisks: enrichedKeyRisks.slice(0, 8),
    explanation,
    recommendations: recommendations.slice(0, 6),
    socialProof,
  };
}

