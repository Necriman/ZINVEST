import type { Language } from "@/lib/translations";
import type { StructuredLesson } from "@/lib/lesson-blocks";
import { FINANCE_EN_LESSON_1, FINANCE_EN_LESSON_2 } from "./finance-fundamentals-en.generated";
import { FINANCE_RU_LESSON_1, FINANCE_RU_LESSON_2 } from "./finance-fundamentals-ru.generated";
import { FINANCE_UZ_LESSON_1, FINANCE_UZ_LESSON_2 } from "./finance-fundamentals-uz.generated";
import { FINANCE_EN_LESSON_3, FINANCE_EN_LESSON_4 } from "./finance-fundamentals-en.units34.generated";
import { FINANCE_RU_LESSON_3, FINANCE_RU_LESSON_4 } from "./finance-fundamentals-ru.units34.generated";
import { FINANCE_UZ_LESSON_3, FINANCE_UZ_LESSON_4 } from "./finance-fundamentals-uz.units34.generated";

const EMPTY: StructuredLesson = {
  title: "…",
  content: [{ type: "paragraph", text: "" }],
};

export function getFinanceStructuredLesson(lessonId: number, language: Language): StructuredLesson {
  if (lessonId === 1) {
    if (language === "en") return FINANCE_EN_LESSON_1;
    if (language === "ru") return FINANCE_RU_LESSON_1;
    if (language === "uz") return FINANCE_UZ_LESSON_1;
  }
  if (lessonId === 2) {
    if (language === "en") return FINANCE_EN_LESSON_2;
    if (language === "ru") return FINANCE_RU_LESSON_2;
    if (language === "uz") return FINANCE_UZ_LESSON_2;
  }
  if (lessonId === 3) {
    if (language === "en") return FINANCE_EN_LESSON_3;
    if (language === "ru") return FINANCE_RU_LESSON_3;
    if (language === "uz") return FINANCE_UZ_LESSON_3;
  }
  if (lessonId === 4) {
    if (language === "en") return FINANCE_EN_LESSON_4;
    if (language === "ru") return FINANCE_RU_LESSON_4;
    if (language === "uz") return FINANCE_UZ_LESSON_4;
  }
  return EMPTY;
}
