import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { calculateRisk, type RiskInputData, type AnalyzeAnswers } from "@/lib/scoring";
import type { Language } from "@/lib/translations";

type ChatMode = "finance" | "general" | "analyze";

type AnalysisType =
  | "loan"
  | "installment"
  | "purchase"
  | "order"
  | "invest"
  | "longterm_invest";

type MissingField = "amount" | "income" | "contract" | "relationship" | "deadline";

function parseAnalysisType(raw: unknown): AnalysisType {
  const v = typeof raw === "string" ? raw : "";
  if (
    v === "loan" ||
    v === "installment" ||
    v === "purchase" ||
    v === "order" ||
    v === "invest" ||
    v === "longterm_invest"
  )
    return v;
  return "loan";
}

type UnitContext = {
  title?: string;
  focus?: string;
};

const FINANCE_SYSTEM_PROMPT = `Ты Zinvest AI — дружелюбный и компетентный помощник по финансовому образованию для Zinvest (обучающий подход).

Отвечай на языке пользователя.

Твоя роль:
- Объясняй финансовые концепции ясно и просто, без сложного жаргона
- Помогай понимать темы: денежный поток (cash flow), бюджетирование, инвестирование, налоги, прибыль vs. выручка, финансовая отчетность и личные финансы
- Используй аналогии и примеры из реальной жизни
- Поддерживай и ободряй — многие пользователи новички
- Держи ответ кратким, но полным (2-4 коротких абзаца, если не просили больше)
- Иногда предлагай релевантные обучающие модули Zinvest

Ты НЕ даешь персональные финансовые советы, не рекомендуешь конкретные акции/инструменты и не являешься лицензированным финансовым консультантом.

ТОЛЬКО ФИНАНСЫ:
- Ты отвечаешь ТОЛЬКО на вопросы про финансы.
- Если пользователь спрашивает что-то НЕ про финансы, вежливо объясни, что это вне твоей области (финансовое обучение), и предложи вместо этого финансовый аспект: общий образовательный совет, как применить это к деньгам/финансовым решениям, или предложи модуль Zinvest.

Помни: ты не даешь персональные рекомендации по инвестициям.

Тон: теплый, ясный и уверенный, как умный друг, который действительно понимает финансы.`;

const GENERAL_SYSTEM_PROMPT = `Ты Zinvest AI и отвечаешь только про финансы.

Отвечай на языке пользователя.

Если вопрос НЕ про финансы — вежливо объясни, что это вне твоей области, и предложи финансовую интерпретацию или образовательный совет.

Ты НЕ даешь персональные инвестиционные рекомендации и не являешься лицензированным консультантом.
Тон: дружелюбный, прямой и практичный.`;

const ANALYZE_SYSTEM_PROMPT = `Ты Zinvest AI помощник для оценки риска (risk scoring).

Отвечай на языке пользователя.

Ты помогаешь пользователю: задаешь короткие и точные вопросы, затем формируешь структурированные данные для оценки риска.

Ты ДОЛЖЕН отвечать ТОЛЬКО валидным JSON (никакого markdown и никакого лишнего текста).

Две возможные формы ответа:

1) status = "question" (запрос следующего вопроса)
{
  "status": "question",
  "question": "string",
  "data": {
    "amount"?: number,
    "income"?: number,
    "contract"?: boolean,
      "relationship"?: "known" | "unknown" | "известно" | "неизвестно",
    "deadline"?: number
  }
}

2) status = "scored" (все поля должны быть присутствовать и валидны)
{
  "status": "scored",
  "data": {
    "amount": number,
    "income": number,
    "contract": boolean,
      "relationship": "known" | "unknown" | "известно" | "неизвестно",
    "deadline": number
  }
}

Правила:
- amount и income должны быть числами (не строками).
- deadline должен быть числом В ДНЯХ. Преобразуй недели (~*7) и месяцы (~*30) при необходимости.
- contract = true только если есть формальный письменный договор/соглашение.
- relationship = "unknown", если контрагент не доверенный/не известен пользователю.
- Если не хватает информации, выбирай status="question" и спрашивай следующую недостающую деталь.
- Не угадывай неоднозначные значения — запрашивай уточнения.
- Стиль вопросов:
  - Для relationship проси ответ ровно одним словом (эквивалент: known/unknown в языке пользователя).
    При разборе распознавай: known/известно/ma'lum -> "known", unknown/неизвестно/noma'lum -> "unknown".
  - Для contract проси ответ ровно одним словом (эквивалент: yes/no в языке пользователя).
    При разборе распознавай: yes/да/ha/true/1 -> contract=true, no/нет/yo'q/false/0 -> contract=false.
  - Для amount/income/deadline проси одно число.

`;

function tryParseJsonFromText(raw: string): any | null {
  const text = raw.trim();

  // 1) Direct parse
  try {
    return JSON.parse(text);
  } catch {
    // ignore
  }

  // 2) Strip common markdown wrappers / prefixes.
  // Examples:
  // - json { ... }
  // - ```json { ... } ```
  const stripped = text
    .replace(/^json\s*/i, "")
    .replace(/^```json\s*/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // ignore
  }

  // 3) Extract first {...} block if model included extra text.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const candidate = text.slice(first, last + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // ignore
    }
  }

  return null;
}

function normalizeRiskInput(raw: any): RiskInputData | null {
  const amount = Number(raw?.amount);
  const income = Number(raw?.income);
  let contract: boolean = false;
  if (typeof raw?.contract === "boolean") {
    contract = raw.contract;
  } else if (typeof raw?.contract === "string") {
    const v = raw.contract.toLowerCase().trim();
    const trueSet = ["да", "true", "yes", "1", "ha", "ok", "oui"];
    const falseSet = ["нет", "false", "no", "0", "yo'q", "yoq", "noint", "nope", "non"];
    if (trueSet.includes(v)) contract = true;
    else if (falseSet.includes(v)) contract = false;
    else contract = false;
  } else {
    if (raw?.contract === 1 || raw?.contract === "1") contract = true;
    else if (raw?.contract === 0 || raw?.contract === "0") contract = false;
    else contract = Boolean(raw?.contract);
  }
  const deadline = Number(raw?.deadline);
  const relRaw = typeof raw?.relationship === "string" ? raw.relationship.toLowerCase().trim() : "";

  let relationship: RiskInputData["relationship"] = "known";
  const unknownSet = [
    "unknown",
    "неизвестно",
    "неизвестный",
    "неизвестен",
    "noma'lum",
    "nomalum",
    "noma'lum.",
    "noma'lum?",
  ];
  const knownSet = [
    "known",
    "известно",
    "известный",
    "izvestno",
    "ma'lum",
    "malum",
  ];
  if (
    relRaw === "unknown" ||
    relRaw === "неизвестно" ||
    relRaw.startsWith("неизвест") ||
    relRaw.startsWith("noma") ||
    unknownSet.includes(relRaw)
  ) {
    relationship = "unknown";
  }
  if (
    relRaw === "known" ||
    relRaw === "известно" ||
    relRaw.startsWith("извест") ||
    relRaw.startsWith("ma'") ||
    relRaw.startsWith("ma ") ||
    knownSet.includes(relRaw)
  ) {
    relationship = "known";
  }

  if (!Number.isFinite(amount) || amount < 0) return null;
  if (!Number.isFinite(income) || income < 0) return null;
  if (!Number.isFinite(deadline) || deadline < 0) return null;

  return { amount, income, contract, relationship, deadline };
}

function deriveMissingQuestion(
  data: any,
  analysisType: AnalysisType,
  language: Language
): { question: string; missingField: MissingField } {
  const amount = data?.amount;
  const income = data?.income;
  const contract = data?.contract;
  const relationship = data?.relationship;
  const deadline = data?.deadline;

  const amountOk = typeof amount === "number" && Number.isFinite(amount) && amount >= 0;
  const incomeOk = typeof income === "number" && Number.isFinite(income) && income >= 0;
  const contractOk = typeof contract === "boolean";

  const relationshipValue =
    typeof relationship === "string" ? relationship.toLowerCase().trim() : "";

  const relationshipOk =
    // canonical tokens (from JSON spec)
    relationshipValue === "known" ||
    relationshipValue === "unknown" ||
    // Russian labels
    relationshipValue === "известно" ||
    relationshipValue === "неизвестно" ||
    // Uzbek labels (common variants)
    relationshipValue === "ma'lum" ||
    relationshipValue === "malum" ||
    relationshipValue.startsWith("ma ") ||
    relationshipValue.startsWith("ma'") ||
    relationshipValue === "noma'lum" ||
    relationshipValue === "nomalum" ||
    relationshipValue.startsWith("noma ") ||
    relationshipValue.startsWith("noma'");

  const deadlineOk = typeof deadline === "number" && Number.isFinite(deadline) && deadline >= 0;

  const { yesWord, noWord, knownWord, unknownWord } = (() => {
    if (language === "en") {
      return { yesWord: "yes", noWord: "no", knownWord: "known", unknownWord: "unknown" };
    }
    if (language === "uz") {
      return { yesWord: "ha", noWord: "yo'q", knownWord: "ma'lum", unknownWord: "noma'lum" };
    }
    return { yesWord: "да", noWord: "нет", knownWord: "известно", unknownWord: "неизвестно" };
  })();

  const scenarioLabel = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
          return "loan";
        case "installment":
          return "installments";
        case "purchase":
          return "purchase";
        case "order":
          return "order/supply";
        case "invest":
          return "investing";
        case "longterm_invest":
          return "long-term investing";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
          return "kredit";
        case "installment":
          return "bo'lib to'lash";
        case "purchase":
          return "sotib olish";
        case "order":
          return "buyurtma/yetkazib berish";
        case "invest":
          return "investitsiya";
        case "longterm_invest":
          return "uzoq muddatli investitsiya";
      }
    }
    switch (analysisType) {
      case "loan":
        return "займа";
      case "installment":
        return "рассрочки";
      case "purchase":
        return "покупки";
      case "order":
        return "заказа/поставки";
      case "invest":
        return "инвестирования";
      case "longterm_invest":
        return "долгосрочных вложений";
    }
  })();

  const amountPrompt = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
          return "💸 loan amount";
        case "installment":
          return "🏦 installment total";
        case "purchase":
          return "🛒 purchase cost";
        case "order":
          return "📦 order/supply cost";
        case "invest":
          return "📈 investing amount";
        case "longterm_invest":
          return "🧩 long-term amount";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
          return "💸 kredit umumiy summasi";
        case "installment":
          return "🏦 bo'lib to'lash umumiy summasi";
        case "purchase":
          return "🛒 sotib olish qiymati";
        case "order":
          return "📦 buyurtma/yetkazib berish qiymati";
        case "invest":
          return "📈 investitsiya summasi";
        case "longterm_invest":
          return "🧩 uzoq muddatli investitsiya summasi";
      }
    }
    switch (analysisType) {
      case "loan":
        return "💸 сумма займа";
      case "installment":
        return "🏦 общая сумма по рассрочке";
      case "purchase":
        return "🛒 стоимость покупки/заказа";
      case "order":
        return "📦 стоимость заказа/поставки";
      case "invest":
        return "📈 сумма инвестирования";
      case "longterm_invest":
        return "🧩 сумма долгосрочных вложений";
    }
  })();

  const incomePrompt = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
          return "👤 borrower's monthly income";
        case "installment":
          return "👤 monthly income for installment payments";
        case "purchase":
          return "👤 monthly income to cover costs after purchase";
        case "order":
          return "👤 monthly income to pay for the order";
        case "invest":
          return "👤 your monthly income/free cash";
        case "longterm_invest":
          return "👤 stable monthly income for long-term investing";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
          return "👤 qarzdorning oylik daromadi";
        case "installment":
          return "👤 bo'lib to'lash to'lovlari uchun oylik daromad";
        case "purchase":
          return "👤 sotib olgandan keyin xarajatlarni qoplash uchun daromad";
        case "order":
          return "👤 buyurtmani to'lash uchun oylik daromad";
        case "invest":
          return "👤 oylik daromadingiz/erkin mablag'";
        case "longterm_invest":
          return "👤 uzoq muddatli investitsiya uchun oylik muntazam daromad";
      }
    }
    switch (analysisType) {
      case "loan":
        return "👤 ежемесячный доход заемщика";
      case "installment":
        return "👤 ежемесячный доход заемщика для платежей по рассрочке";
      case "purchase":
        return "👤 ежемесячный доход для покрытия расходов после покупки";
      case "order":
        return "👤 ежемесячный доход для оплаты заказа";
      case "invest":
        return "👤 ваш ежемесячный доход/свободные средства";
      case "longterm_invest":
        return "👤 регулярный ежемесячный доход для долгосрочных вложений";
    }
  })();

  const contractPrompt = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
          return "📝 a formal written loan agreement";
        case "installment":
          return "📝 a written installment agreement/schedule";
        case "purchase":
          return "📝 a purchase/contract document";
        case "order":
          return "📝 a written confirmation for order/supply";
        case "invest":
          return "📝 an agreement/terms with the platform or broker";
        case "longterm_invest":
          return "📝 a long-term investment agreement";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
          return "📝 rasmiy yozma kredit shartnomasi";
        case "installment":
          return "📝 bo'lib to'lash bo'yicha yozma kelishuv/jadval";
        case "purchase":
          return "📝 sotib olish shartnomasi";
        case "order":
          return "📝 buyurtma/yetkazib berish bo'yicha yozma tasdiq";
        case "invest":
          return "📝 platforma/broker bilan shartnoma/uning shartlari";
        case "longterm_invest":
          return "📝 uzoq muddatli investitsiya bo'yicha shartnoma";
      }
    }
    switch (analysisType) {
      case "loan":
        return "📝 договор/соглашение по займу";
      case "installment":
        return "📝 письменное соглашение/график по рассрочке";
      case "purchase":
        return "📝 договор/заказ на покупку";
      case "order":
        return "📝 письменное подтверждение заказа/поставки";
      case "invest":
        return "📝 договор/регламент платформы или брокера";
      case "longterm_invest":
        return "📝 инвестиционное соглашение (условия долгосрока)";
    }
  })();

  const relationshipPrompt = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
          return "🤝 the counterparty is known to you and you trust them";
        case "installment":
          return "🤝 the seller/supplier is known to you and you trust them";
        case "purchase":
          return "🤝 the seller is known to you and you trust them";
        case "order":
          return "🤝 the order supplier/executor is known to you and you trust them";
        case "invest":
          return "🤝 the platform/broker is known to you and you trust them";
        case "longterm_invest":
          return "🤝 the platform/partner is known to you and you trust them";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
          return "🤝 kontragent sizga tanish va siz unga ishonasiz";
        case "installment":
          return "🤝 bo'lib to'lash bo'yicha sotuvchi/ta'minotchi sizga tanish va ishonasiz";
        case "purchase":
          return "🤝 sotuvchi sizga tanish va siz unga ishonasiz";
        case "order":
          return "🤝 buyurtma/yetkazib beruvchi sizga tanish va siz ishonasiz";
        case "invest":
          return "🤝 platforma/broker sizga tanish va siz ishonasiz";
        case "longterm_invest":
          return "🤝 platforma/hamkor sizga tanish va siz ishonasiz";
      }
    }
    switch (analysisType) {
      case "loan":
        return "🤝 контрагент по займу вам знаком и вы ему доверяете";
      case "installment":
        return "🤝 продавец/поставщик по рассрочке вам знаком и вы ему доверяете";
      case "purchase":
        return "🤝 продавец вам знаком и вы ему доверяете";
      case "order":
        return "🤝 поставщик/исполнитель заказа вам знаком и вы ему доверяете";
      case "invest":
        return "🤝 платформа/брокер вам знаком и вы ему доверяете";
      case "longterm_invest":
        return "🤝 платформа/партнер вам знаком и вы ему доверяете (для долгосрока)";
    }
  })();

  const deadlinePrompt = (() => {
    if (language === "en") {
      switch (analysisType) {
        case "loan":
        case "installment":
        case "purchase":
        case "order":
          return "⏳ repayment/payment term in days";
        case "invest":
        case "longterm_invest":
          return "⏳ investing/holding horizon in days";
      }
    }
    if (language === "uz") {
      switch (analysisType) {
        case "loan":
        case "installment":
        case "purchase":
        case "order":
          return "⏳ to'lash/qaytarish muddati (kunlarda)";
        case "invest":
        case "longterm_invest":
          return "⏳ investitsiya/ushlab turish ufqi (kunlarda)";
      }
    }
    switch (analysisType) {
      case "loan":
      case "installment":
      case "purchase":
      case "order":
        return "⏳ срок оплаты/погашения в днях";
      case "invest":
      case "longterm_invest":
        return "⏳ горизонт инвестирования/удержания в днях";
    }
  })();

  if (!amountOk) {
    return {
      question:
        language === "ru"
          ? `Введите ${amountPrompt}. Укажите только число (USD). Например: 1000`
          : language === "en"
            ? `Enter the ${amountPrompt}. Provide only one number (USD). Example: 1000`
            : `Kiriting ${amountPrompt}. Faqat bitta raqamni kiriting (USD). Masalan: 1000`,
      missingField: "amount",
    };
  }
  if (!incomeOk) {
    return {
      question:
        language === "ru"
          ? `Введите ${incomePrompt}. Укажите только число (USD). Например: 2000`
          : language === "en"
            ? `Enter ${incomePrompt}. Provide only one number (USD). Example: 2000`
            : `Kiriting ${incomePrompt}. Faqat bitta raqamni kiriting (USD). Masalan: 2000`,
      missingField: "income",
    };
  }
  if (!contractOk) {
    return {
      question:
        language === "ru"
          ? `📝 ${contractPrompt}. Ответьте: ${yesWord} или ${noWord}.`
          : language === "en"
            ? `📝 ${contractPrompt}. Reply: ${yesWord} or ${noWord}.`
            : `📝 ${contractPrompt}. Javob bering: ${yesWord} yoki ${noWord}.`,
      missingField: "contract",
    };
  }
  if (!relationshipOk) {
    return {
      question:
        language === "ru"
          ? `${relationshipPrompt}. Ответьте: ${knownWord} или ${unknownWord}.`
          : language === "en"
            ? `${relationshipPrompt}. Reply: ${knownWord} or ${unknownWord}.`
            : `${relationshipPrompt}. Javob bering: ${knownWord} yoki ${unknownWord}.`,
      missingField: "relationship",
    };
  }
  if (!deadlineOk) {
    return {
      question:
        language === "ru"
          ? `Введите ${deadlinePrompt}. Укажите только число (в днях). Например: 14`
          : language === "en"
            ? `Enter ${deadlinePrompt}. One number only (days). Example: 14`
            : `Kiriting ${deadlinePrompt}. Faqat bitta raqam (kunlarda). Masalan: 14`,
      missingField: "deadline",
    };
  }

  return {
    question:
      language === "ru"
        ? `Пожалуйста, уточните данные по сценарию: ${scenarioLabel}.`
        : language === "en"
          ? `Please уточните missing data for: ${scenarioLabel}.`
          : `Iltimos, ${scenarioLabel} bo'yicha yetishmayotgan ma'lumotni aniqlang.`,
    missingField: "amount",
  };
}

function buildSystemPrompt(base: string, unit?: UnitContext, mode?: ChatMode) {
  const unitTitle = unit?.title?.trim();
  const unitFocus = unit?.focus?.trim();

  if (!unitTitle && !unitFocus) return base;

  const unitBlock = [
    "Контекст модуля/темы (адаптируй ответ под это):",
    unitTitle ? `- Заголовок: ${unitTitle}` : null,
    unitFocus ? `- Фокус: ${unitFocus}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const modeBlock =
    mode === "general"
      ? ""
      : "\n\nЕсли уместно, свяжи объяснение с обучающим модулем и держи фокус на образовании.";

  return `${base}\n\n${unitBlock}${modeBlock}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ANALYZE_QUESTION_ORDER: MissingField[] = [
  "amount",
  "income",
  "contract",
  "relationship",
  "deadline",
];

type RiskQuestion = {
  id: MissingField;
  type: "number" | "choice";
  weight: number;
};

// Internal structured question system (id/text/type/weight).
// Frontend chips rely on the same `missingField` ids.
const ANALYZE_QUESTIONS: RiskQuestion[] = [
  { id: "amount", type: "number", weight: 0.2 },
  { id: "income", type: "number", weight: 0.2 },
  { id: "contract", type: "choice", weight: 0.2 },
  { id: "relationship", type: "choice", weight: 0.2 },
  { id: "deadline", type: "number", weight: 0.2 },
];

function normalizeText(raw: string) {
  return raw.toLowerCase().trim();
}

function parseFirstNumber(raw: string): number | null {
  const s = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!s) return null;
  const v = Number(s[0]);
  return Number.isFinite(v) ? v : null;
}

function parseContract(raw: string): boolean | null {
  const v = normalizeText(raw).replace(/[^\p{L}\p{N}'’-]+/gu, " ");
  const tokensTrue = ["да", "true", "yes", "1", "ha", "ok", "oui", "топ"]; // tolerant
  const tokensFalse = ["нет", "false", "no", "0", "yo'q", "yoq", "non", "nope", "non"];
  const collapsed = v.replace(/\s+/g, " ").trim();
  if (tokensTrue.includes(collapsed)) return true;
  if (tokensFalse.includes(collapsed)) return false;
  // also try direct contains match for inputs like "да, есть"
  if (tokensTrue.some((t) => collapsed.includes(t))) return true;
  if (tokensFalse.some((t) => collapsed.includes(t))) return false;
  return null;
}

function parseRelationship(raw: string): RiskInputData["relationship"] | null {
  const v = normalizeText(raw);
  const unknownTokens = [
    "unknown",
    "неизвестно",
    "неизвестный",
    "неизвестен",
    "noma'lum",
    "nomalum",
    "noma'lum",
    "noma",
  ];
  const knownTokens = ["known", "известно", "известный", "izvestno", "ma'lum", "malum", "ma"];

  if (unknownTokens.some((t) => v.includes(t))) return "unknown";
  if (knownTokens.some((t) => v.includes(t))) return "known";
  return null;
}

function getLocalizedTokens(language: Language) {
  if (language === "en") {
    return { yesWord: "yes", noWord: "no", knownWord: "known", unknownWord: "unknown" };
  }
  if (language === "uz") {
    return { yesWord: "ha", noWord: "yo'q", knownWord: "ma'lum", unknownWord: "noma'lum" };
  }
  return { yesWord: "да", noWord: "нет", knownWord: "известно", unknownWord: "неизвестно" };
}

function getScenarioPhrase(analysisType: AnalysisType, language: Language) {
  // Minimal scenario phrases, used for question wording.
  if (language === "en") {
    switch (analysisType) {
      case "loan":
        return "this loan";
      case "installment":
        return "this installment plan";
      case "purchase":
        return "this purchase";
      case "order":
        return "this order/supply";
      case "invest":
        return "this investment";
      case "longterm_invest":
        return "this long-term investment";
    }
  }
  if (language === "uz") {
    switch (analysisType) {
      case "loan":
        return "bu kredit";
      case "installment":
        return "bu bo'lib to'lash";
      case "purchase":
        return "bu sotib olish";
      case "order":
        return "bu buyurtma/yetkazib berish";
      case "invest":
        return "bu investitsiya";
      case "longterm_invest":
        return "bu uzoq muddatli investitsiya";
    }
  }
  switch (analysisType) {
    case "loan":
      return "по займу";
    case "installment":
      return "по рассрочке";
    case "purchase":
      return "для покупки";
    case "order":
      return "для заказа/поставки";
    case "invest":
      return "для инвестирования";
    case "longterm_invest":
      return "для долгосрочных вложений";
  }
}

function buildRiskQuestionText(
  fieldId: MissingField,
  analysisType: AnalysisType,
  language: Language
) {
  const { yesWord, noWord, knownWord, unknownWord } = getLocalizedTokens(language);
  const scenario = getScenarioPhrase(analysisType, language);

  if (language === "en") {
    switch (fieldId) {
      case "amount":
        return `💸 Enter the amount for ${scenario}. One number only (USD).`;
      case "income":
        return `👤 Enter the monthly income for ${scenario}. One number only (USD).`;
      case "contract":
        return `📝 Is there a formal written agreement for ${scenario}? Reply: ${yesWord} or ${noWord}.`;
      case "relationship":
        return `🤝 Do you know the counterparty for ${scenario} and trust them? Reply: ${knownWord} or ${unknownWord}.`;
      case "deadline":
        return `⏳ Enter the repayment/payment term in days for ${scenario}. One number only.`;
    }
  }

  if (language === "uz") {
    switch (fieldId) {
      case "amount":
        return `💸 ${scenario} uchun summa kiriting. Faqat bitta raqam (USD).`;
      case "income":
        return `👤 ${scenario} uchun oylik daromad kiriting. Faqat bitta raqam (USD).`;
      case "contract":
        return `📝 ${scenario} uchun rasmiy yozma shartnoma bormi? Javob: ${yesWord} yoki ${noWord}.`;
      case "relationship":
        return `🤝 ${scenario} bo'yicha hamkor sizga tanish va siz unga ishonasizmi? Javob: ${knownWord} yoki ${unknownWord}.`;
      case "deadline":
        return `⏳ ${scenario} uchun to'lov/qaytarish muddati (kunlarda). Faqat bitta raqam.`;
    }
  }

  // ru
  switch (fieldId) {
    case "amount":
      return `💸 Введите сумму ${scenario}. Укажите только число (USD).`;
    case "income":
      return `👤 Введите ежемесячный доход для ${scenario}. Укажите только число (USD).`;
    case "contract":
      return `📝 Есть ли формальный письменный договор/соглашение для ${scenario}? Ответьте: ${yesWord} или ${noWord}.`;
    case "relationship":
      return `🤝 Контрагент для ${scenario} вам знаком и вы ему доверяете? Ответьте: ${knownWord} или ${unknownWord}.`;
    case "deadline":
      return `⏳ Укажите срок оплаты/погашения в днях для ${scenario}. Укажите одно число.`;
  }
}

function extractRiskAnswersFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  analysisType: AnalysisType
) {
  // Assumption (compatible with current UI):
  // - The first user message is always the scenario seed: "Я выбрал: ..."
  // - After that, each subsequent user message answers the next field in order.
  const userMessages = messages.filter((m) => m.role === "user");
  const answerMessages = userMessages.slice(1); // skip seed

  const answers: Partial<RiskInputData> = {};

  for (let i = 0; i < ANALYZE_QUESTION_ORDER.length && i < answerMessages.length; i++) {
    const fieldId = ANALYZE_QUESTION_ORDER[i];
    const text = answerMessages[i]?.content ?? "";

    if (fieldId === "amount") {
      answers.amount = Number(parseFirstNumber(text) ?? NaN);
    } else if (fieldId === "income") {
      answers.income = Number(parseFirstNumber(text) ?? NaN);
    } else if (fieldId === "deadline") {
      answers.deadline = Number(parseFirstNumber(text) ?? NaN);
    } else if (fieldId === "contract") {
      const v = parseContract(text);
      if (v === null) continue;
      answers.contract = v;
    } else if (fieldId === "relationship") {
      const v = parseRelationship(text);
      if (v === null) continue;
      answers.relationship = v;
    }
  }

  const missingField = ANALYZE_QUESTION_ORDER.find((id) => {
    const v = (answers as any)[id];
    if (id === "contract") return typeof v !== "boolean";
    if (id === "relationship") return v !== "known" && v !== "unknown";
    return typeof v !== "number" || !Number.isFinite(v) || v < 0;
  });

  return { answers: answers as Partial<RiskInputData>, missingField: missingField ?? null };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, mode, unit, analysisType, userId } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      mode?: ChatMode;
      unit?: UnitContext;
      analysisType?: AnalysisType;
      userId?: string | null;
      language?: Language;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const resolvedMode: ChatMode =
      mode === "general" ? "general" : mode === "analyze" ? "analyze" : "finance";

    const resolvedLanguage: Language =
      body && typeof (body as any).language === "string"
        ? ((body as any).language as Language)
        : "ru";

    // Some hosting panels store env values with quotes/spaces.
    // Analyze mode is deterministic and does not require Anthropic.
    const apiKey =
      resolvedMode !== "analyze"
        ? process.env.ANTHROPIC_API_KEY?.trim().replace(/^['"]/, "").replace(/['"]$/, "") ?? ""
        : "";
    if (resolvedMode !== "analyze" && !apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const languageLabel =
      resolvedLanguage === "en"
        ? "English"
        : resolvedLanguage === "uz"
          ? "Uzbek"
          : "Russian";

    const systemPrompt =
      resolvedMode === "analyze"
        ? `${ANALYZE_SYSTEM_PROMPT}\n\nScenario type: ${parseAnalysisType(
            analysisType
          )}.\nЯзык ответа пользователя: ${languageLabel}.`
        : `${buildSystemPrompt(
            resolvedMode === "general" ? GENERAL_SYSTEM_PROMPT : FINANCE_SYSTEM_PROMPT,
            unit,
            resolvedMode
          )}\n\nЯзык ответа пользователя: ${languageLabel}.`;

    // Deterministic Analyze Risk flow: NO random scoring and NO AI JSON parsing.
    // We ask structured questions step-by-step and compute scores from answers.
    if (resolvedMode === "analyze") {
      const scenario = parseAnalysisType(analysisType);

      type AnalyzeMissingField =
        | "contract"
        | "contract_reason"
        | "relationship"
        | "identity_verified"
        | "past_defaults"
        | "transparency"
        | "urgency"
        | "collateral_provided"
        | "penalty_terms_present"
        | "delivery_reliability"
        | "guaranteed_return"
        | "amount"
        | "income"
        | "repayment_plan"
        | "savings"
        | "deadline";

      type AnalyzeValue = any;
      type AnalyzeAnswersState = Partial<AnalyzeAnswers>;

      const userMessages = messages.filter((m) => m.role === "user").slice(1); // skip seed
      const answers: AnalyzeAnswersState = {};

      const scenarioPhrase = (() => {
        if (resolvedLanguage === "en") {
          switch (scenario) {
            case "loan":
              return "this loan";
            case "installment":
              return "this installment plan";
            case "purchase":
              return "this purchase";
            case "order":
              return "this order/supply";
            case "invest":
              return "this investment";
            case "longterm_invest":
              return "this long-term investment";
          }
        }
        if (resolvedLanguage === "uz") {
          switch (scenario) {
            case "loan":
              return "bu kredit";
            case "installment":
              return "bu bo'lib to'lash";
            case "purchase":
              return "bu sotib olish";
            case "order":
              return "bu buyurtma/yetkazib berish";
            case "invest":
              return "bu investitsiya";
            case "longterm_invest":
              return "bu uzoq muddatli investitsiya";
          }
        }
        // ru
        switch (scenario) {
          case "loan":
            return "по займу";
          case "installment":
            return "по рассрочке";
          case "purchase":
            return "для покупки";
          case "order":
            return "для заказа/поставки";
          case "invest":
            return "для инвестирования";
          case "longterm_invest":
            return "для долгосрочных вложений";
        }
      })();

      const normalizeText = (s: string) => s.toLowerCase().trim();

      const parseBoolean = (raw: string): boolean | null => {
        const v = normalizeText(raw);
        const trueSet = ["да", "true", "yes", "1", "ha", "ok", "oui"];
        const falseSet = ["нет", "false", "no", "0", "yo'q", "yoq", "non", "nope"];
        if (trueSet.includes(v)) return true;
        if (falseSet.includes(v)) return false;
        // tolerant includes
        if (trueSet.some((t) => v.includes(t))) return true;
        if (falseSet.some((t) => v.includes(t))) return false;
        return null;
      };

      const parseChoice = (
        fieldId: AnalyzeMissingField,
        raw: string
      ): AnalyzeValue | null => {
        const v = normalizeText(raw);

        if (fieldId === "contract_reason") {
          if (v.includes("устн") || v.includes("verbal") || v.includes("oral")) return "verbal";
          if (v.includes("услов") || v.includes("not provided") || v.includes("missing")) return "missing_terms";
          if (v.includes("не уверен") || v.includes("not sure") || v.includes("unknown") || v.includes("не знаю")) return "not_sure";
          return null;
        }

        if (fieldId === "identity_verified") {
          if (v.includes("подтвер") || v.includes("verified") || v.includes("tasdiq")) return "verified";
          if (v.includes("частич") || v.includes("partial") || v.includes("qisman")) return "partial";
          if (v.includes("не подтверж") || v.includes("not verified") || v.includes("tasdiqlanmagan") || v.includes("noma'lum")) return "not_verified";
          return null;
        }

        if (fieldId === "past_defaults") {
          if (v.includes("никог") || v.includes("never")) return "never";
          if (v.includes("один") || v.includes("once") || v.includes("1")) return "once";
          if (v.includes("мног") || v.includes("часто") || v.includes("many") || v.includes("было")) return "many";
          return null;
        }

        if (fieldId === "transparency") {
          if (v.includes("высок") || v.includes("прозрач") || v.includes("high")) return "high";
          if (v.includes("сред") || v.includes("medium") || v.includes("o'rt")) return "medium";
          if (v.includes("низк") || v.includes("low") || v.includes("непрозрач")) return "low";
          return null;
        }

        if (fieldId === "urgency") {
          if (v.includes("сроч") || v.includes("дав") || v.includes("высок") || v.includes("high")) return "high";
          if (v.includes("умер") || v.includes("medium") || v.includes("o'rt")) return "medium";
          if (v.includes("не ср") || v.includes("низк") || v.includes("low")) return "low";
          return null;
        }

        if (fieldId === "repayment_plan") {
          if (v.includes("консерват") || v.includes("conservative") || v.includes("zaxir")) return "conservative";
          if (v.includes("умер") || v.includes("moderate")) return "moderate";
          if (v.includes("агресс") || v.includes("aggressive") || v.includes("на авось")) return "aggressive";
          return null;
        }

        if (fieldId === "delivery_reliability") {
          if (v.includes("надеж") || v.includes("reliable")) return "reliable";
          if (v.includes("неяс") || v.includes("uncertain") || v.includes("sometimes")) return "uncertain";
          if (v.includes("неизвест") || v.includes("unknown")) return "unknown";
          return null;
        }

        return null;
      };

      // Use the existing parseRelationship(raw) helper defined above (outside this block).

      const parseAnalyzeValueForField = (fieldId: AnalyzeMissingField, raw: string): AnalyzeValue | null => {
        if (fieldId === "contract") return parseBoolean(raw);
        if (fieldId === "collateral_provided") return parseBoolean(raw);
        if (fieldId === "penalty_terms_present") return parseBoolean(raw);
        if (fieldId === "guaranteed_return") return parseBoolean(raw);
        if (fieldId === "relationship") return parseRelationship(raw);
        if (fieldId === "amount" || fieldId === "income" || fieldId === "deadline" || fieldId === "savings") {
          const n = parseFirstNumber(raw);
          return n === null ? null : n;
        }
        // choice
        return parseChoice(fieldId, raw);
      };

      const buildQuestionText = (fieldId: AnalyzeMissingField) => {
        const ru = (s: string) => s;
        const en = (s: string) => s;
        const uz = (s: string) => s;

        if (resolvedLanguage === "en") {
          switch (fieldId) {
            case "contract":
              return en("📝 Does a formal written agreement exist for this deal? Reply: yes or no.");
            case "contract_reason":
              return en("Why is there no written agreement? Reply with one option.");
            case "relationship":
              return en("How many financial interactions have you had with this counterparty? Choose: known or unknown.");
            case "identity_verified":
              return en("Have you verified their identity/registration data? Reply: verified / partial / not verified.");
            case "past_defaults":
              return en("Have they ever been late with payments or failed to repay? Reply: never / once / many.");
            case "transparency":
              return en("How transparent are the documents and deal terms? Reply: high / medium / low.");
            case "urgency":
              return en("Is there strong time pressure (\"need it urgently\")? Reply: low / medium / high.");
            case "collateral_provided":
              return en("Is there collateral/guarantee (asset, guarantor, pledge)? Reply: yes or no.");
            case "penalty_terms_present":
              return en("Are there penalty terms for overdue payments? Reply: yes or no.");
            case "delivery_reliability":
              return en("How reliable is delivery/execution by the supplier? Reply: reliable / uncertain / unknown.");
            case "guaranteed_return":
              return en("Are they promising guaranteed profit/fixed returns? Reply: yes or no.");
            case "amount":
              return en(`💸 Enter the deal amount (${scenarioPhrase}). One number (USD).`);
            case "income":
              return en(`👤 Enter your monthly income (${scenarioPhrase}). One number (USD).`);
            case "repayment_plan":
              return en("If income drops, what is your repayment plan? Reply: conservative / moderate / aggressive.");
            case "savings":
              return en("How much free savings do you have (USD)? One number.");
            case "deadline":
              return en("⏳ Enter the repayment/payment term in days. One number.");
          }
        }

        if (resolvedLanguage === "uz") {
          switch (fieldId) {
            case "contract":
              return uz("📝 Rasmiy yozma shartnoma bormi? Javob: ha yoki yo'q.");
            case "contract_reason":
              return uz("Nega yozma shartnoma yo'q? Variantlardan birini tanlang.");
            case "relationship":
              return uz("Siz ushbu hamkor bilan oldin qancha moliyaviy tajribaga ega bo'lgansiz? Tanlang: ma'lum yoki noma'lum.");
            case "identity_verified":
              return uz("Shaxs/ro'yxat ma'lumotlarini tekshirganmisiz? Javob: tasdiqlangan / qisman / tasdiqlanmagan.");
            case "past_defaults":
              return uz("Ular to'lovni kechiktirganmi yoki qaytarmaganmi? Javob: hech qachon / bir marta / ko'p marotaba.");
            case "transparency":
              return uz("Hujjatlar va shartlar qanchalik shaffof? Javob: yuqori / o'rtacha / past.");
            case "urgency":
              return uz("Kuchli muddat bosimi bormi? Javob: past / o'rtacha / yuqori.");
            case "collateral_provided":
              return uz("Ta'minot/garanti bormi (garov, kafillik)? Javob: ha yoki yo'q.");
            case "penalty_terms_present":
              return uz("Kechikish uchun jarima shartlari bormi? Javob: ha yoki yo'q.");
            case "delivery_reliability":
              return uz("Yetkazib berish/bajarilish qanchalik ishonchli? Javob: ishonchli / noaniq / noma'lum.");
            case "guaranteed_return":
              return uz("Kafolatlangan foyda/fiks daromad va'da qilinadimi? Javob: ha yoki yo'q.");
            case "amount":
              return uz(`💸 Bitim summasini kiriting (${scenarioPhrase}). Bitta raqam (USD).`);
            case "income":
              return uz(`👤 Oylik daromadingizni kiriting (${scenarioPhrase}). Bitta raqam (USD).`);
            case "repayment_plan":
              return uz("Daromad tushib qolsa, qaytarish rejasi qanday? Javob: konservativ / o'rtacha / agressiv.");
            case "savings":
              return uz("Erkin jamg'armangiz qancha (USD)? Bitta raqam.");
            case "deadline":
              return uz("⏳ To'lov/qaytarish muddatini kunlarda kiriting. Bitta raqam.");
          }
        }

        // ru
        switch (fieldId) {
          case "contract":
            return ru("📝 Есть ли формальный письменный договор/соглашение для сделки? Ответьте: да или нет.");
          case "contract_reason":
            return ru("Почему у сделки нет письменного договора? Выберите один вариант.");
          case "relationship":
            return ru("Сколько раз вы сталкивались с этим контрагентом в финансовых взаимодействиях? Ответьте: известно или неизвестно.");
          case "identity_verified":
            return ru("Проверяли ли вы личность/регистрационные данные контрагента? Выберите: подтверждено / частично / не подтверждено.");
          case "past_defaults":
            return ru("Были ли случаи просрочек/неплатежей? Выберите: никогда / один раз / многократно.");
          case "transparency":
            return ru("Насколько прозрачно предоставляются документы и условия? Выберите: высокая / средняя / низкая прозрачность.");
          case "urgency":
            return ru("Есть ли сильное давление по срокам “нужно срочно”? Выберите: низкое / среднее / высокое.");
          case "collateral_provided":
            return ru("🛡 Есть ли обеспечение/залог/поручительство? Ответьте: да или нет.");
          case "penalty_terms_present":
            return ru("⚖ Есть ли прописанные штрафы/пенальти за просрочку? Ответьте: да или нет.");
          case "delivery_reliability":
            return ru("Насколько надежно поставщик соблюдает сроки/исполнение? Выберите: надежно / неясно / неизвестно.");
          case "guaranteed_return":
            return ru("⚠️ Обещают ли гарантированную прибыль/фиксированный доход? Ответьте: да или нет.");
          case "amount":
            return ru(`💸 Введите сумму сделки ${scenarioPhrase}. Одно число (USD).`);
          case "income":
            return ru(`👤 Введите ваш ежемесячный доход ${scenarioPhrase}. Одно число (USD).`);
          case "repayment_plan":
            return ru("Если доход временно снизится, как вы будете погашать? Выберите: консервативно / умеренно / агрессивно.");
          case "savings":
            return ru("💼 Сколько свободных накоплений у вас есть (USD)? Одно число.");
          case "deadline":
            return ru("⏳ Укажите срок оплаты/погашения в днях. Одно число.");
        }
      };

      type Step = { id: AnalyzeMissingField; when: (a: AnalyzeAnswersState) => boolean; parse: (raw: string) => AnalyzeValue | null; };

      const stepsBase: Step[] = [
        { id: "contract", when: () => true, parse: (raw) => parseAnalyzeValueForField("contract", raw) },
        { id: "contract_reason", when: (a) => a.contract === false, parse: (raw) => parseAnalyzeValueForField("contract_reason", raw) },
        { id: "relationship", when: () => true, parse: (raw) => parseAnalyzeValueForField("relationship", raw) },
        { id: "identity_verified", when: (a) => a.relationship === "unknown", parse: (raw) => parseAnalyzeValueForField("identity_verified", raw) },
        { id: "past_defaults", when: () => true, parse: (raw) => parseAnalyzeValueForField("past_defaults", raw) },
        { id: "transparency", when: () => true, parse: (raw) => parseAnalyzeValueForField("transparency", raw) },
        { id: "urgency", when: () => true, parse: (raw) => parseAnalyzeValueForField("urgency", raw) },
      ];

      const scenarioSteps: Step[] = (() => {
        if (scenario === "loan") {
          return [{ id: "collateral_provided", when: () => true, parse: (raw) => parseAnalyzeValueForField("collateral_provided", raw) }];
        }
        if (scenario === "installment") {
          return [{ id: "penalty_terms_present", when: () => true, parse: (raw) => parseAnalyzeValueForField("penalty_terms_present", raw) }];
        }
        if (scenario === "purchase" || scenario === "order") {
          return [{ id: "delivery_reliability", when: () => true, parse: (raw) => parseAnalyzeValueForField("delivery_reliability", raw) }];
        }
        return [{ id: "guaranteed_return", when: () => true, parse: (raw) => parseAnalyzeValueForField("guaranteed_return", raw) }];
      })();

      const tailSteps: Step[] = [
        { id: "amount", when: () => true, parse: (raw) => parseAnalyzeValueForField("amount", raw) },
        { id: "income", when: () => true, parse: (raw) => parseAnalyzeValueForField("income", raw) },
        {
          id: "repayment_plan",
          when: (a) => {
            if (typeof a.amount !== "number" || typeof a.income !== "number") return false;
            if (!Number.isFinite(a.income) || a.income <= 0) return false;
            return a.amount > 0.5 * a.income;
          },
          parse: (raw) => parseAnalyzeValueForField("repayment_plan", raw),
        },
        { id: "savings", when: () => true, parse: (raw) => parseAnalyzeValueForField("savings", raw) },
        { id: "deadline", when: () => true, parse: (raw) => parseAnalyzeValueForField("deadline", raw) },
      ];

      const allSteps = [...stepsBase, ...scenarioSteps, ...tailSteps];
      const totalSteps = allSteps.length;

      const answeredCount = () => {
        let c = 0;
        for (const s of allSteps) {
          if (answers[s.id] !== undefined && answers[s.id] !== null) c++;
        }
        return c;
      };

      let userIndex = 0;
      // Walk through the chat like a deterministic state machine.
      while (true) {
        const nextStep = allSteps.find((s) => s.when(answers) && (answers[s.id] === undefined || answers[s.id] === null));
        if (!nextStep) {
          // All required answers are present
          const inputData: RiskInputData = {
            amount: Number(answers.amount),
            income: Number(answers.income),
            contract: Boolean(answers.contract),
            relationship: (answers.relationship as any) ?? "known",
            deadline: Number(answers.deadline),
          };

          const scoring = calculateRisk(answers as AnalyzeAnswers, scenario, resolvedLanguage);
          const out = {
            risk: scoring.score,
            verdict: scoring.verdict,
            confidence: scoring.confidence,
            reasons: scoring.reasons,
            language: resolvedLanguage,
            dealRiskScore: scoring.dealRiskScore,
            userCapacityScore: scoring.userCapacityScore,
          };

          try {
            const supabase = getSupabase();
            if (supabase) {
              await supabase.from("analyses").insert({
                user_id: typeof userId === "string" ? userId : null,
                type: scenario,
                input_data: inputData,
                result: out,
              });
            }
          } catch (e) {
            console.error("Analyze persist error:", e);
          }

          return NextResponse.json({ ...out, inputData });
        }

        // Need more user answers
        if (userIndex >= userMessages.length) {
          const text = buildQuestionText(nextStep.id);
          const progress = Math.round((answeredCount() / totalSteps) * 100);
          return NextResponse.json({ text, missingField: nextStep.id as any, progress });
        }

        const rawAnswer = userMessages[userIndex]?.content ?? "";
        const parsed = nextStep.parse(rawAnswer);
        if (parsed === null || parsed === undefined) {
          // Ask the same question again (user entered invalid format)
          const text = buildQuestionText(nextStep.id);
          const progress = Math.round((answeredCount() / totalSteps) * 100);
          return NextResponse.json({ text, missingField: nextStep.id as any, progress });
        }

        answers[nextStep.id as keyof AnalyzeAnswersState] = parsed;
        userIndex++;

        // Simulate "AI thinking" delay between steps (typing animation).
        await sleep(450);
      }
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData?.error?.message || `Upstream error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";

    // Analyze mode is handled deterministically above (and returns early),
    // so at this point we can always return plain text.
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
