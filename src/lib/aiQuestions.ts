import type { AnalyzeAnswers, AnalysisType } from "./scoring";
import type { Language } from "@/lib/translations";

export type FollowUpQuestion = {
  id:
    | "contract_reason"
    | "identity_verified"
    | "stable_income_proof"
    | "documentation_completeness"
    | "repayment_plan";
  text: string;
  priority: number;
};

function normLang(language: Language) {
  return language === "en" ? "en" : language === "uz" ? "uz" : "ru";
}

function deterministicFollowUps(
  answers: Partial<AnalyzeAnswers>,
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
      priority: 85,
      text:
        l === "en"
          ? "Do they have stable, verifiable income proof?"
          : l === "uz"
            ? "Ularda barqaror va tasdiqlangan daromad isboti bormi?"
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
  const base = deterministicFollowUps(answers, language);

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

