import type { AnalyzeAnswers, AnalysisType } from "./scoring";
import type { Language } from "@/lib/translations";

export type FollowUpQuestion = {
  id:
    | "contract_reason"
    | "identity_verified"
    | "stable_income_proof"
    | "documentation_completeness"
    | "repayment_plan"
    | "monthly_payment"
    | "existing_debts";
  text: string;
  priority: number;
};

export type AdaptiveQuestionContext = {
  scenario: AnalysisType;
  answers: Partial<AnalyzeAnswers>;
  missingFields: string[];
  riskFlags: string[];
  language: Language;
};

function normLang(language: Language) {
  return language === "en" ? "en" : language === "uz" ? "uz" : "ru";
}

function deterministicFollowUps(
  answers: Partial<AnalyzeAnswers>,
  analysisType: AnalysisType,
  language: Language
): FollowUpQuestion[] {
  const l = normLang(language);
  const q: FollowUpQuestion[] = [];

  if (answers.contract === false) {
    q.push({
      id: "contract_reason",
      priority: 100,
      text:
        l === "en"
          ? "Why is there no written contract?"
          : l === "uz"
            ? "Nega yozma shartnoma yo'q?"
            : "Почему нет письменного договора?",
    });
  }

  if (answers.relationship === "unknown") {
    q.push({
      id: "identity_verified",
      priority: 95,
      text:
        l === "en"
          ? "Have you verified this person's identity?"
          : l === "uz"
            ? "Bu shaxsning kimligini tekshirdingizmi?"
            : "Вы проверили личность этого человека?",
    });
    q.push({
      id: "stable_income_proof",
      priority:
        analysisType === "installment" ||
        analysisType === "purchase" ||
        analysisType === "order"
          ? 75
          : 85,
      text:
        l === "en"
          ? analysisType === "installment" ||
            analysisType === "purchase" ||
            analysisType === "order"
            ? "Do you have stable, verifiable income proof for this payment plan?"
            : "Do they have stable, verifiable income proof?"
          : l === "uz"
            ? analysisType === "installment" ||
              analysisType === "purchase" ||
              analysisType === "order"
              ? "Ushbu to'lov rejasi uchun sizda barqaror daromad isboti bormi?"
              : "Ularda barqaror va tasdiqlangan daromad isboti bormi?"
            : analysisType === "installment" ||
              analysisType === "purchase" ||
              analysisType === "order"
              ? "Есть ли у вас подтверждение стабильного дохода для этого платежа?"
              : "Есть ли у них подтверждение стабильного дохода?",
    });
  }

  const amount = Number(answers.amount ?? NaN);
  const income = Number(answers.income ?? NaN);
  if (Number.isFinite(amount) && Number.isFinite(income) && income > 0 && amount > income) {
    q.push({
      id: "repayment_plan",
      priority: 90,
      text:
        l === "en"
          ? "What happens if your income drops during repayment?"
          : l === "uz"
            ? "Qaytarish paytida daromad kamayib qolsa nima bo'ladi?"
            : "Что будет, если доход снизится во время погашения?",
    });
  }

  if (answers.urgency === "high") {
    q.push({
      id: "documentation_completeness",
      priority: 80,
      text:
        l === "en"
          ? "Are all deal documents complete and verifiable?"
          : l === "uz"
            ? "Bitim hujjatlari to'liq va tekshiriladiganmi?"
            : "Полный ли пакет документов по сделке и можно ли его проверить?",
    });
  }

  return q.sort((a, b) => b.priority - a.priority);
}

export async function generateFollowUpQuestions(
  answers: Partial<AnalyzeAnswers>,
  analysisType: AnalysisType,
  language: Language = "ru"
): Promise<FollowUpQuestion[]> {
  const base = deterministicFollowUps(answers, analysisType, language);

  // Optional AI boost: re-rank or add one extra conditional follow-up.
  const aiFollowUpEnabled = process.env.AI_FOLLOWUP_ENABLE === "true";
  if (!aiFollowUpEnabled) return base;
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey) return base;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: process.env.OPENAI_FOLLOWUP_MODEL?.trim() || "gpt-4o-mini",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "You are a fintech risk assistant. Return JSON only with `priorityOrder` as an array of known ids: contract_reason, identity_verified, stable_income_proof, documentation_completeness, repayment_plan.",
            },
            {
              role: "user",
              content: JSON.stringify({
                language,
                scenario: analysisType,
                answers,
                existingIds: base.map((x) => x.id),
              }),
            },
          ],
        }),
      });
      if (!res.ok) return base;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(content);
      const order: string[] = Array.isArray(parsed?.priorityOrder) ? parsed.priorityOrder : [];
      if (!order.length) return base;
      const rank = new Map(order.map((id, i) => [id, i]));
      return base
        .slice()
        .sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return base;
  }
}

export async function generateAdaptiveQuestion(
  context: AdaptiveQuestionContext
): Promise<FollowUpQuestion | null> {
  const l = normLang(context.language);
  const { scenario, answers, riskFlags } = context;

  // Deterministic high-priority adaptive questioning first.
  if (scenario === "installment") {
    if (answers.monthly_payment === undefined || answers.monthly_payment === null) {
      return {
        id: "monthly_payment",
        priority: 99,
        text:
          l === "en"
            ? "What monthly payment amount are you planning (USD)?"
            : l === "uz"
              ? "Oyiga qancha to'lov qilasiz (USD)?"
              : "Какой ежемесячный платеж планируете (USD)?",
      };
    }
    if (answers.existing_debts === undefined || answers.existing_debts === null) {
      return {
        id: "existing_debts",
        priority: 95,
        text:
          l === "en"
            ? "How much do you already pay monthly on existing debts (USD)?"
            : l === "uz"
              ? "Hozirgi qarzlar bo'yicha oyiga qancha to'lov qilasiz (USD)?"
              : "Сколько уже платите по текущим долгам в месяц (USD)?",
      };
    }
  }

  if (riskFlags.includes("high_amount_vs_income")) {
    return {
      id: "repayment_plan",
      priority: 96,
      text:
        l === "en"
          ? "If your income drops for 2-3 months, how will you continue payments?"
          : l === "uz"
            ? "Daromad 2-3 oyga tushib qolsa, to'lovlarni qanday davom ettirasiz?"
            : "Если доход снизится на 2-3 месяца, как будете продолжать платежи?",
    };
  }

  if (riskFlags.includes("no_contract")) {
    return {
      id: "contract_reason",
      priority: 92,
      text:
        l === "en"
          ? "Why is there no formal written agreement for this deal?"
          : l === "uz"
            ? "Nega bu bitim uchun rasmiy yozma shartnoma yo'q?"
            : "Почему по этой сделке нет формального письменного договора?",
    };
  }

  if (riskFlags.includes("unknown_counterparty")) {
    return {
      id: "identity_verified",
      priority: 90,
      text:
        l === "en"
          ? "How exactly did you find this person and what identity checks did you do?"
          : l === "uz"
            ? "Bu odamni qayerdan topdingiz va qanday shaxsni tekshirish qildingiz?"
            : "Как вы нашли этого человека и какие проверки личности вы уже сделали?",
    };
  }

  return null;
}

