import type { AnalyzeAnswers } from "./scoring";
import type { Language } from "@/lib/translations";

export type ContradictionResult = {
  contradictions: string[];
  penalty: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function detectContradictions(
  answers: Partial<AnalyzeAnswers>,
  language: Language = "ru"
): ContradictionResult {
  const contradictions: string[] = [];
  let penalty = 0;

  const amount = Number(answers.amount ?? NaN);
  const income = Number(answers.income ?? NaN);
  const savings = Number(answers.savings ?? NaN);

  if (Number.isFinite(amount) && Number.isFinite(income) && income > 0 && amount > income * 3) {
    contradictions.push(
      language === "en"
        ? "Deal amount exceeds realistic repayment capacity."
        : language === "uz"
          ? "Bitim summasi real qaytarish imkoniyatidan oshib ketgan."
          : "Сумма сделки превышает реалистичную платежеспособность."
    );
    penalty += 26;
  }

  if (
    Number.isFinite(amount) &&
    Number.isFinite(savings) &&
    savings < amount &&
    answers.repayment_plan === "aggressive"
  ) {
    contradictions.push(
      language === "en"
        ? "No financial buffer with aggressive repayment strategy."
        : language === "uz"
          ? "Agressiv qaytarish strategiyasida moliyaviy zaxira yetarli emas."
          : "Нет финансового буфера при агрессивной стратегии погашения."
    );
    penalty += 22;
  }

  if (answers.contract === false && answers.relationship === "unknown") {
    contradictions.push(
      language === "en"
        ? "No contract with an unknown counterparty."
        : language === "uz"
          ? "Noma'lum hamkor bilan shartnoma yo'q."
          : "Нет договора при неизвестном контрагенте."
    );
    penalty += 30;
  }

  if (answers.urgency === "high" && answers.documentation_completeness === "none") {
    contradictions.push(
      language === "en"
        ? "High urgency combined with no supporting documents."
        : language === "uz"
          ? "Yuqori shoshilinchlik va tasdiqlovchi hujjatlar yo'qligi birga uchramoqda."
          : "Высокая срочность сочетается с отсутствием подтверждающих документов."
    );
    penalty += 20;
  }

  if (answers.guaranteed_return === true && answers.relationship === "unknown") {
    contradictions.push(
      language === "en"
        ? "Guaranteed return promised by an unknown counterparty."
        : language === "uz"
          ? "Noma'lum hamkor tomonidan kafolatlangan foyda va'da qilinmoqda."
          : "Гарантированную доходность обещает неизвестный контрагент."
    );
    penalty += 30;
  }

  return {
    contradictions,
    penalty: clamp(penalty, 0, 100),
  };
}

