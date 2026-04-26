import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { calculateRisk } from "../../../lib/scoring";
import type { RiskInputData, AnalyzeAnswers } from "../../../lib/scoring";
import { generateRiskAIExplanation } from "@/lib/ai";
import { generateFollowUpQuestions, generateAdaptiveQuestion } from "@/lib/aiQuestions";
import { questions } from "@/lib/questions";
import { simulateScenarios } from "@/lib/simulation";
import { detectContradictions } from "@/lib/contradictions";
import { evaluateBehavioralRisk } from "@/lib/behavior";
import { calculateConfidence } from "@/lib/confidence";
import { detectScenario, type DetectedScenario } from "@/lib/scenarioDetector";
import { questionTrees } from "@/lib/questionTrees";
import type { Language } from "@/lib/translations";
export const runtime = "nodejs";

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

function inferAnalysisTypeFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  fallback: AnalysisType
): AnalysisType {
  const userSeed = messages
    .filter((m) => m.role === "user")
    .map((m) => (m.content || "").toLowerCase())
    .join(" ");

  // Installment / pay later
  if (
    userSeed.includes("рассроч") ||
    userSeed.includes("в рассрочку") ||
    userSeed.includes("installment") ||
    userSeed.includes("pay later") ||
    userSeed.includes("bo'lib") ||
    userSeed.includes("muddatli")
  ) {
    return "installment";
  }

  // Investment
  if (
    userSeed.includes("инвест") ||
    userSeed.includes("investment") ||
    userSeed.includes("investits")
  ) {
    return "invest";
  }

  // Purchase / order
  if (
    userSeed.includes("купить") ||
    userSeed.includes("покупк") ||
    userSeed.includes("заказ") ||
    userSeed.includes("purchase") ||
    userSeed.includes("order") ||
    userSeed.includes("sotib")
  ) {
    return "purchase";
  }

  // Loan / lend
  if (
    userSeed.includes("займ") ||
    userSeed.includes("одолж") ||
    userSeed.includes("loan") ||
    userSeed.includes("lend") ||
    userSeed.includes("qarz")
  ) {
    return "loan";
  }

  return fallback;
}

function mapDetectedScenarioToAnalysisType(
  detected: DetectedScenario
): AnalysisType {
  if (detected === "installment") return "installment";
  if (detected === "lend") return "loan";
  if (detected === "investment") return "invest";
  if (detected === "supplier") return "order";
  return "purchase";
}

type UnitContext = {
  title?: string;
  focus?: string;
  courseKey?: "finance-fundamentals" | "investing-basics";
  lessonId?: number;
  /** Full lesson text from the interactive lesson UI (replaces legacy PDF extraction). */
  lessonBodyText?: string;
};

async function buildLessonMaterialContext(
  unit: UnitContext | undefined,
  language: Language,
  _messages: Array<{ role: "user" | "assistant"; content: string }>
): Promise<string | null> {
  const lessonId = Number(unit?.lessonId);
  const bodyText =
    typeof unit?.lessonBodyText === "string" ? unit.lessonBodyText.trim() : "";
  if (!bodyText) return null;

  const header =
    language === "ru"
      ? `Урок ${Number.isFinite(lessonId) && lessonId > 0 ? lessonId : ""}. Текст урока (может быть отредактирован учеником):`
      : language === "uz"
        ? `Dars ${Number.isFinite(lessonId) && lessonId > 0 ? lessonId : ""}. Dars matni (o‘quvchi tahrirlashi mumkin):`
        : `Lesson ${Number.isFinite(lessonId) && lessonId > 0 ? lessonId : ""}. Lesson text (learner may have edited):`;

  return `${header}\n\n${bodyText.slice(0, 12000)}`;
}

const FINANCE_SYSTEM_PROMPT = `Ты Zinvest AI — дружелюбный и компетентный помощник по финансовому и бизнес-образованию для Zinvest (обучающий подход).

Отвечай на языке пользователя.

Стиль ответа (обязательно):
- Пиши как опытный финансовый консультант Zinvest: уверенно, конкретно, практично.
- Не используй шаблонные фразы в стиле "К сожалению, я не могу..." без крайней необходимости.
- Если нет точной цитаты страницы, все равно дай полезный предметный ответ по теме урока и явно укажи, что это краткое объяснение по теме.
- Сразу переходи к сути: сначала ответ, затем короткие пункты/пример.
- Никогда не пиши "у меня нет доступа к странице/нумерации/материалу". Вместо этого дай лучший возможный ответ по контексту урока.

Твоя роль:
- Объясняй финансовые концепции ясно и просто, без сложного жаргона
- Помогай понимать темы: денежный поток (cash flow), бюджетирование, инвестирование, налоги, прибыль vs. выручка, финансовая отчетность и личные финансы
- Умей разбирать бизнес-идеи и делать базовый рыночный анализ в образовательном формате
- Помогай по бизнес-темам: выбор ниши, бизнес-модель, ценообразование, unit-экономика, точка безубыточности, MVP, каналы продаж, операционные риски
- Используй аналогии и примеры из реальной жизни
- Поддерживай и ободряй — многие пользователи новички
- Держи ответ кратким, но полным (2-4 коротких абзаца, если не просили больше)
- Иногда предлагай релевантные обучающие модули Zinvest

Если пользователь спрашивает "какой бизнес лучше" или просит сравнить варианты:
- Сначала уточни контекст (город/регион, бюджет, опыт, сроки окупаемости, формат офлайн/онлайн, уровень риска)
- Если данных мало — дай 2-4 реалистичных варианта и отметь, какие допущения сделал
- Для каждого варианта сравни: спрос, конкуренцию, примерную маржу, стартовые затраты, операционные риски, срок выхода в плюс
- Добавляй простую оценку по шкале 1-10 (потенциал, риск, сложность запуска)
- Завершай конкретной рекомендацией: "лучший вариант при таких условиях", "второй вариант", "с чего начать за первые 2-4 недели"
- Не придумывай точные рыночные цифры без оговорки; если нет данных, так и скажи и предложи как проверить гипотезу

Локализация под Узбекистан (по умолчанию):
- Если пользователь не указал страну/город, считай базовым контекстом Узбекистан и явно отмечай это допущение
- Денежные примеры по умолчанию приводи в UZS (сум), при необходимости можно добавить ориентир в USD
- Используй практичные локальные примеры (торговля, услуги, онлайн-продажи, семейный бизнес, самозанятость)
- Учитывай местные реалии: уровень доходов, чувствительность к стартовым затратам, сезонность, роль Telegram/Instagram/marketplaces как каналов продаж
- Для регулируемых сфер напоминай проверить актуальные требования, налоги, лицензии и правила региона

Ты НЕ даешь персональные инвестиционные советы по конкретным акциям/инструментам и не являешься лицензированным финансовым консультантом.

ГРАНИЦЫ ТЕМ:
- Ты отвечаешь на вопросы про финансы, бизнес и предпринимательство (в образовательном формате).
- Если вопрос полностью вне этих тем, вежливо объясни, что это вне твоей области, и предложи финансово-бизнесовую интерпретацию.
- Обсуждай только законные и этичные бизнес-модели; при высокорисковых/регулируемых нишах (например, гемблинг, контент 18+) делай акцент на правовых ограничениях, комплаенсе, рисках репутации и финансовой устойчивости.

Помни: ты не даешь персональные рекомендации по инвестициям.

Тон: теплый, ясный и уверенный, как умный друг, который действительно понимает финансы и бизнес.`;

const GENERAL_SYSTEM_PROMPT = `Ты Zinvest AI и отвечаешь про финансы, бизнес и предпринимательство.

Отвечай на языке пользователя.

Если вопрос полностью вне финансов и бизнеса — вежливо объясни, что это вне твоей области, и предложи финансово-бизнесовую интерпретацию или образовательный совет.

Если вопрос про выбор бизнеса, нишу, доходность идеи или анализ рынка:
- Отвечай как финансовый наставник: сравнивай варианты по спросу, конкуренции, затратам, маржинальности, рискам и сроку окупаемости
- Если контекста мало, сначала задай 3-5 уточняющих вопросов; затем дай структурированное сравнение и практичный следующий шаг
- В конце предлагай план проверки гипотезы (MVP, первые продажи, метрики)

Локальный контекст:
- Если страна/регион не указаны, используй Узбекистан как базовый рынок и сообщай это как рабочее допущение
- Все базовые расчеты и примеры давай в UZS (сум), при необходимости добавляй ориентир в USD
- Учитывай локальные каналы привлечения клиентов и типичные ограничения малого бизнеса

Ты НЕ даешь персональные инвестиционные рекомендации и не являешься лицензированным консультантом.
Обсуждай только законные и этичные бизнес-модели; для регулируемых ниш отмечай юридические и репутационные риски.
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
- relationship = "неизвестно", если контрагент не доверенный/не известен пользователю.
- Если не хватает информации, выбирай status="question" и спрашивай следующую недостающую деталь.
- Не угадывай неоднозначные значения — запрашивай уточнения.
- Стиль вопросов:
  - Для relationship проси ответ ровно одним словом (эквивалент: известен/неизвестен в языке пользователя).
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

function buildSystemPrompt(
  base: string,
  unit?: UnitContext,
  mode?: ChatMode,
  lessonMaterial?: string | null
) {
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
  const lessonBlock = lessonMaterial
    ? `\n\nКонтекст учебного материала (используй для ответов по уроку/странице):\n${lessonMaterial}`
    : "";

  return `${base}\n\n${unitBlock}${modeBlock}${lessonBlock}`;
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

function parseDurationToDays(raw: string): number | null {
  const n = parseFirstNumber(raw);
  if (n === null) return null;
  const text = normalizeText(raw);

  // years
  if (
    text.includes("year") ||
    text.includes("год") ||
    text.includes("лет") ||
    text.includes("yil")
  ) {
    return Math.round(n * 365);
  }
  // months
  if (
    text.includes("month") ||
    text.includes("месяц") ||
    text.includes("мес") ||
    text.includes("oy")
  ) {
    return Math.round(n * 30);
  }
  // weeks
  if (
    text.includes("week") ||
    text.includes("недел") ||
    text.includes("hafta")
  ) {
    return Math.round(n * 7);
  }
  // explicit days or default fallback
  return Math.round(n);
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
      answers.deadline = Number(parseDurationToDays(text) ?? NaN);
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

function enforceZinvestTone(raw: string, language: Language): string {
  let text = String(raw ?? "").trim();
  if (!text) return text;

  const blockedPatterns = [
    /к сожалению[^.!?]*доступ/gi,
    /нет прямого доступа[^.!?]*/gi,
    /не смог[^.!?]*загрузить[^.!?]*pdf/gi,
    /i (?:can't|cannot|do not) (?:access|load)[^.!?]*/gi,
  ];
  for (const p of blockedPatterns) text = text.replace(p, "").trim();

  if (!text) {
    return language === "en"
      ? "Here is a concise explanation from this lesson with practical takeaways:"
      : language === "uz"
        ? "Quyida ushbu dars bo'yicha aniq va amaliy tushuntirish:"
        : "Ниже краткое и практичное объяснение по материалу урока:";
  }

  return text;
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
      stream?: boolean;
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
    const wantsStream = Boolean((body as any)?.stream) && resolvedMode !== "analyze";

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

    const lessonMaterialContext =
      resolvedMode === "analyze"
        ? null
        : await buildLessonMaterialContext(unit, resolvedLanguage, messages);

    const systemPrompt =
      resolvedMode === "analyze"
        ? `${ANALYZE_SYSTEM_PROMPT}\n\nScenario type: ${parseAnalysisType(
            analysisType
          )}.\nЯзык ответа пользователя: ${languageLabel}.`
        : `${buildSystemPrompt(
            resolvedMode === "general" ? GENERAL_SYSTEM_PROMPT : FINANCE_SYSTEM_PROMPT,
            unit,
            resolvedMode,
            lessonMaterialContext
          )}\n\nЯзык ответа пользователя: ${languageLabel}.`;

    // Deterministic Analyze Risk flow: NO random scoring and NO AI JSON parsing.
    // We ask structured questions step-by-step and compute scores from answers.
    if (resolvedMode === "analyze") {
      const parsedScenario = parseAnalysisType(analysisType);
      const userSeedText = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content || "")
        .join(" ");
      const detectedScenario = detectScenario(userSeedText);
      // If scenario was not explicitly selected in UI (falls back to loan),
      // infer from user free-text to keep question flow context-aware.
      const scenario =
        analysisType === undefined || analysisType === null
          ? mapDetectedScenarioToAnalysisType(detectedScenario)
          : parsedScenario;

      type AnalyzeMissingField =
        | "item_name"
        | "contract"
        | "contract_reason"
        | "relationship"
        | "identity_verified"
        | "past_defaults"
        | "monthly_payment"
        | "existing_debts"
        | "interest_rate"
        | "necessity_level"
        | "loan_purpose"
        | "expected_return"
        | "founder_known"
        | "business_proof"
        | "revenue_proof"
        | "stable_income_proof"
        | "documentation_completeness"
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
          // Free-text fallback: user answered in narrative form (not button labels).
          if (v.length >= 8) {
            const verificationSignals = [
              "паспорт",
              "id",
              "документ",
              "договор",
              "регистрац",
              "лиценз",
              "check",
              "verify",
              "встреч",
              "адрес",
              "телефон",
              "магаз",
              "store",
              "shop",
              "нашел",
              "нашёл",
              "found",
            ];
            if (verificationSignals.some((s) => v.includes(s))) return "partial";
            // Any meaningful narrative answer is treated as at least partial context.
            return "partial";
          }
          return null;
        }

        if (fieldId === "past_defaults") {
          const n = parseFirstNumber(v);
          if (n !== null) {
            if (n <= 0) return "never";
            if (n <= 1) return "once";
            return "many";
          }
          if (v.includes("никог") || v.includes("never")) return "never";
          if (v.includes("один") || v.includes("once") || v.includes("1")) return "once";
          if (v.includes("мног") || v.includes("часто") || v.includes("many") || v.includes("было")) return "many";
          return null;
        }

        if (fieldId === "necessity_level") {
          if (v.includes("необяз") || v.includes("optional") || v.includes("can wait")) return "optional";
          if (v.includes("нуж") || v.includes("necessary") || v.includes("must")) return "necessary";
          return null;
        }

        if (fieldId === "business_proof" || fieldId === "revenue_proof") {
          if (v.includes("yes") || v.includes("да") || v.includes("ha") || v.includes("пол")) return "yes";
          if (v.includes("част") || v.includes("partial") || v.includes("qisman")) return "partial";
          if (v.includes("нет") || v.includes("no") || v.includes("yo'q")) return "no";
          return null;
        }

        if (fieldId === "stable_income_proof") {
          if (v.includes("подтвер") || v.includes("verified") || v.includes("tasdiq")) return "verified";
          if (v.includes("частич") || v.includes("partial") || v.includes("qisman")) return "partial";
          if (v === "yes" || v === "да" || v === "ha" || v === "true" || v === "1") return "verified";
          if (v.includes("нет") || v.includes("none") || v.includes("yo'q") || v.includes("нет подтверж")) return "none";
          if (v === "no" || v === "yoq" || v === "false" || v === "0") return "none";
          return null;
        }

        if (fieldId === "documentation_completeness") {
          if (v.includes("пол") || v.includes("complete") || v.includes("to'liq")) return "complete";
          if (v.includes("частич") || v.includes("partial") || v.includes("qisman")) return "partial";
          if (v === "yes" || v === "да" || v === "ha" || v === "true" || v === "1") return "complete";
          if (v.includes("нет") || v.includes("none") || v.includes("yo'q")) return "none";
          if (v === "no" || v === "yoq" || v === "false" || v === "0") return "none";
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
          // Users often answer with severity words ("критично") instead of plan labels — map those too.
          if (
            v.includes("консерват") ||
            v.includes("conservative") ||
            v.includes("zaxir") ||
            v.includes("критич") ||
            v.includes("critical") ||
            v.includes("осторож") ||
            v.includes("cautious") ||
            v.includes("буфер") ||
            v.includes("запас") ||
            v.includes("сбереж")
          ) {
            return "conservative";
          }
          if (
            v.includes("умер") ||
            v.includes("moderate") ||
            v.includes("средн") ||
            v.includes("balanced") ||
            v.includes("o'rtacha") ||
            v.includes("нормал")
          ) {
            return "moderate";
          }
          if (
            v.includes("агресс") ||
            v.includes("aggressive") ||
            v.includes("на авось") ||
            v.includes("рискован") ||
            v.includes("max") ||
            v.includes("agressiv")
          ) {
            return "aggressive";
          }
          return null;
        }

        if (fieldId === "delivery_reliability") {
          if (v.includes("надеж") || v.includes("reliable")) return "reliable";
          if (v.includes("неяс") || v.includes("uncertain") || v.includes("sometimes")) return "uncertain";
          if (v.includes("неизвест") || v.includes("unknown")) return "unknown";
          return null;
        }

        if (fieldId === "item_name" || fieldId === "loan_purpose" || fieldId === "founder_known") {
          const text = raw.trim();
          return text.length >= 2 ? text : null;
        }

        return null;
      };

      // Use the existing parseRelationship(raw) helper defined above (outside this block).
      const parseRelationshipFlexible = (
        raw: string
      ): RiskInputData["relationship"] | null => {
        const direct = parseRelationship(raw);
        if (direct) return direct;
        // User may answer with number of prior interactions: 0 => unknown, >0 => known.
        const n = parseFirstNumber(raw);
        if (n !== null) {
          return n > 0 ? "known" : "unknown";
        }
        return null;
      };

      const canonicalValues: Record<AnalyzeMissingField, string[]> = {
        item_name: ["text"],
        contract: ["true", "false"],
        contract_reason: ["verbal", "missing_terms", "not_sure"],
        relationship: ["known", "unknown"],
        identity_verified: ["verified", "partial", "not_verified"],
        past_defaults: ["never", "once", "many"],
        monthly_payment: ["number"],
        existing_debts: ["number"],
        interest_rate: ["number"],
        necessity_level: ["necessary", "optional"],
        loan_purpose: ["text"],
        expected_return: ["number"],
        founder_known: ["text"],
        business_proof: ["yes", "partial", "no"],
        revenue_proof: ["yes", "partial", "no"],
        stable_income_proof: ["verified", "partial", "none"],
        documentation_completeness: ["complete", "partial", "none"],
        transparency: ["high", "medium", "low"],
        urgency: ["low", "medium", "high"],
        collateral_provided: ["true", "false"],
        penalty_terms_present: ["true", "false"],
        delivery_reliability: ["reliable", "uncertain", "unknown"],
        guaranteed_return: ["true", "false"],
        amount: ["number"],
        income: ["number"],
        repayment_plan: ["conservative", "moderate", "aggressive"],
        savings: ["number"],
        deadline: ["number"],
      };

      const parseAnalyzeValueWithAI = async (
        fieldId: AnalyzeMissingField,
        raw: string
      ): Promise<AnalyzeValue | null> => {
        const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
        if (!apiKey) return null;

        const model = process.env.ANTHROPIC_RISK_MODEL?.trim() || "claude-sonnet-4-5";
        const allowed = canonicalValues[fieldId] ?? [];
        const system = `You normalize a user's free-text answer for a fintech risk form.
Return ONLY JSON: {"value": <canonical value or null>}.
No markdown, no extra text.
Allowed canonical values for this field: ${JSON.stringify(allowed)}.
If value cannot be confidently normalized, return null.`;

        const user = `Language: ${resolvedLanguage}
Field: ${fieldId}
Raw user answer: ${raw}`;

        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model,
              max_tokens: 120,
              temperature: 0,
              system,
              messages: [{ role: "user", content: user }],
            }),
          });
          if (!response.ok) return null;
          const data = await response.json();
          const text = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
          const parsed = tryParseJsonFromText(text);
          const value = parsed?.value;
          if (value === null || value === undefined) return null;

          if (
            fieldId === "amount" ||
            fieldId === "income" ||
            fieldId === "deadline" ||
            fieldId === "savings" ||
            fieldId === "monthly_payment" ||
            fieldId === "existing_debts" ||
            fieldId === "interest_rate" ||
            fieldId === "expected_return"
          ) {
            const n =
              fieldId === "deadline"
                ? parseDurationToDays(String(value))
                : Number(value);
            return Number.isFinite(n) ? n : null;
          }
          if (fieldId === "contract" || fieldId === "collateral_provided" || fieldId === "penalty_terms_present" || fieldId === "guaranteed_return") {
            if (value === true || value === "true") return true;
            if (value === false || value === "false") return false;
            return null;
          }
          if (
            fieldId === "item_name" ||
            fieldId === "loan_purpose" ||
            fieldId === "founder_known"
          ) {
            const s = String(value ?? "").trim();
            return s.length >= 2 ? s : null;
          }
          return typeof value === "string" ? value : null;
        } catch {
          return null;
        }
      };

      const parseAnalyzeValueForField = (fieldId: AnalyzeMissingField, raw: string): AnalyzeValue | null => {
        if (fieldId === "contract") return parseBoolean(raw);
        if (fieldId === "collateral_provided") return parseBoolean(raw);
        if (fieldId === "penalty_terms_present") return parseBoolean(raw);
        if (fieldId === "guaranteed_return") return parseBoolean(raw);
        if (fieldId === "relationship") return parseRelationshipFlexible(raw);
        if (
          fieldId === "amount" ||
          fieldId === "income" ||
          fieldId === "deadline" ||
          fieldId === "savings" ||
          fieldId === "monthly_payment" ||
          fieldId === "existing_debts" ||
          fieldId === "interest_rate" ||
          fieldId === "expected_return"
        ) {
          const n =
            fieldId === "deadline"
              ? parseDurationToDays(raw)
              : parseFirstNumber(raw);
          return n === null ? null : n;
        }
        // choice
        return parseChoice(fieldId, raw);
      };

      const buildQuestionText = (fieldId: AnalyzeMissingField) => {
        const treeNode = questionTrees[detectedScenario].find(
          (q) => q.id === fieldId
        );
        if (treeNode) return treeNode.ask(resolvedLanguage);

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
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return en("Do you know this seller/provider and trust them? Reply: known or unknown.");
              }
              return en("How many financial interactions have you had with this counterparty? Choose: known or unknown.");
            case "identity_verified":
              return en("Have you verified their identity/registration data? Reply: verified / partial / not verified.");
            case "past_defaults":
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return en("Were there past cases of delivery failure/refund issues with this seller? Reply: never / once / many.");
              }
              return en("Have they ever been late with payments or failed to repay? Reply: never / once / many.");
            case "stable_income_proof":
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return en("Do you have verifiable proof of your own stable income for this payment plan? Reply: verified / partial / none.");
              }
              return en("Do they have verifiable and stable income proof? Reply: verified / partial / none.");
            case "documentation_completeness":
              return en("How complete are supporting documents? Reply: complete / partial / none.");
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
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return uz("Siz ushbu sotuvchi/ta'minotchini taniysizmi va ishonasizmi? Javob: ma'lum yoki noma'lum.");
              }
              return uz("Siz ushbu hamkor bilan oldin qancha moliyaviy tajribaga ega bo'lgansiz? Tanlang: ma'lum yoki noma'lum.");
            case "identity_verified":
              return uz("Shaxs/ro'yxat ma'lumotlarini tekshirganmisiz? Javob: tasdiqlangan / qisman / tasdiqlanmagan.");
            case "past_defaults":
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return uz("Bu sotuvchi bilan oldin yetkazib berish yoki pul qaytarish muammolari bo'lganmi? Javob: hech qachon / bir marta / ko'p marotaba.");
              }
              return uz("Ular to'lovni kechiktirganmi yoki qaytarmaganmi? Javob: hech qachon / bir marta / ko'p marotaba.");
            case "stable_income_proof":
              if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
                return uz("Bo'lib to'lash uchun o'zingizning barqaror daromad isbotingiz bormi? Javob: tasdiqlangan / qisman / yo'q.");
              }
              return uz("Ularda tasdiqlangan va barqaror daromad isboti bormi? Javob: tasdiqlangan / qisman / yo'q.");
            case "documentation_completeness":
              return uz("Qo'llab-quvvatlovchi hujjatlar qay darajada to'liq? Javob: to'liq / qisman / yo'q.");
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
            if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
              return ru("Вы знакомы с продавцом/поставщиком и доверяете ему? Ответьте: известно или неизвестно.");
            }
            return ru("Сколько раз вы сталкивались с этим контрагентом в финансовых взаимодействиях? Ответьте: известно или неизвестно.");
          case "identity_verified":
            return ru("Проверяли ли вы личность/регистрационные данные контрагента? Выберите: подтверждено / частично / не подтверждено.");
          case "past_defaults":
            if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
              return ru("Были ли у этого продавца случаи срыва поставки/проблем с возвратом? Выберите: никогда / один раз / многократно.");
            }
            return ru("Были ли случаи просрочек/неплатежей? Выберите: никогда / один раз / многократно.");
          case "stable_income_proof":
            if (scenario === "installment" || scenario === "purchase" || scenario === "order") {
              return ru("Есть ли у вас подтверждение собственного стабильного дохода для рассрочки? Выберите: подтверждено / частично / нет.");
            }
            return ru("Есть ли подтверждение стабильного дохода контрагента? Выберите: подтверждено / частично / нет.");
          case "documentation_completeness":
            return ru("Насколько полный пакет документов по сделке? Выберите: полный / частичный / отсутствует.");
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

      const category = (() => {
        if (scenario === "loan") return "lend";
        if (scenario === "installment") return "installment";
        if (scenario === "purchase" || scenario === "order") return "purchase";
        return "investment";
      })();

      const orderedIds = [
        ...questionTrees[detectedScenario].map((q) => q.id),
        ...questions[category].map((q) => q.id),
      ]
        .filter((id, idx, arr) => arr.indexOf(id) === idx) as AnalyzeMissingField[];

      const stepById: Partial<Record<AnalyzeMissingField, Step>> = {
        item_name: {
          id: "item_name",
          when: () => detectedScenario === "installment" || detectedScenario === "purchase",
          parse: (raw) => parseAnalyzeValueForField("item_name", raw),
        },
        contract: {
          id: "contract",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("contract", raw),
        },
        contract_reason: {
          id: "contract_reason",
          when: (a) => a.contract === false,
          parse: (raw) => parseAnalyzeValueForField("contract_reason", raw),
        },
        relationship: {
          id: "relationship",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("relationship", raw),
        },
        identity_verified: {
          id: "identity_verified",
          when: (a) => a.relationship === "unknown",
          parse: (raw) => parseAnalyzeValueForField("identity_verified", raw),
        },
        past_defaults: {
          id: "past_defaults",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("past_defaults", raw),
        },
        monthly_payment: {
          id: "monthly_payment",
          when: () => detectedScenario === "installment",
          parse: (raw) => parseAnalyzeValueForField("monthly_payment", raw),
        },
        existing_debts: {
          id: "existing_debts",
          when: () => detectedScenario === "installment",
          parse: (raw) => parseAnalyzeValueForField("existing_debts", raw),
        },
        interest_rate: {
          id: "interest_rate",
          when: () => detectedScenario === "installment",
          parse: (raw) => parseAnalyzeValueForField("interest_rate", raw),
        },
        necessity_level: {
          id: "necessity_level",
          when: () => detectedScenario === "installment",
          parse: (raw) => parseAnalyzeValueForField("necessity_level", raw),
        },
        loan_purpose: {
          id: "loan_purpose",
          when: () => scenario === "loan",
          parse: (raw) => parseAnalyzeValueForField("loan_purpose", raw),
        },
        expected_return: {
          id: "expected_return",
          when: () => scenario === "invest" || scenario === "longterm_invest",
          parse: (raw) => parseAnalyzeValueForField("expected_return", raw),
        },
        founder_known: {
          id: "founder_known",
          when: () => scenario === "invest" || scenario === "longterm_invest",
          parse: (raw) => parseAnalyzeValueForField("founder_known", raw),
        },
        business_proof: {
          id: "business_proof",
          when: () => scenario === "invest" || scenario === "longterm_invest",
          parse: (raw) => parseAnalyzeValueForField("business_proof", raw),
        },
        revenue_proof: {
          id: "revenue_proof",
          when: () => scenario === "invest" || scenario === "longterm_invest",
          parse: (raw) => parseAnalyzeValueForField("revenue_proof", raw),
        },
        stable_income_proof: {
          id: "stable_income_proof",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("stable_income_proof", raw),
        },
        documentation_completeness: {
          id: "documentation_completeness",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("documentation_completeness", raw),
        },
        transparency: {
          id: "transparency",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("transparency", raw),
        },
        urgency: {
          id: "urgency",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("urgency", raw),
        },

        collateral_provided: {
          id: "collateral_provided",
          when: () => scenario === "loan",
          parse: (raw) => parseAnalyzeValueForField("collateral_provided", raw),
        },
        penalty_terms_present: {
          id: "penalty_terms_present",
          when: () => scenario === "installment",
          parse: (raw) => parseAnalyzeValueForField("penalty_terms_present", raw),
        },
        delivery_reliability: {
          id: "delivery_reliability",
          when: () => scenario === "purchase" || scenario === "order",
          parse: (raw) => parseAnalyzeValueForField("delivery_reliability", raw),
        },
        guaranteed_return: {
          id: "guaranteed_return",
          when: () => scenario === "invest" || scenario === "longterm_invest",
          parse: (raw) => parseAnalyzeValueForField("guaranteed_return", raw),
        },

        amount: {
          id: "amount",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("amount", raw),
        },
        income: {
          id: "income",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("income", raw),
        },
        repayment_plan: {
          id: "repayment_plan",
          when: (a) => {
            if (typeof a.amount !== "number" || typeof a.income !== "number") return false;
            if (!Number.isFinite(a.income) || a.income <= 0) return false;
            const baseThreshold = 0.5;
            const highUrgencyThreshold = 0.3;
            const threshold = a.urgency === "high" ? highUrgencyThreshold : baseThreshold;
            return a.amount > threshold * a.income;
          },
          parse: (raw) => parseAnalyzeValueForField("repayment_plan", raw),
        },
        savings: {
          id: "savings",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("savings", raw),
        },
        deadline: {
          id: "deadline",
          when: () => true,
          parse: (raw) => parseAnalyzeValueForField("deadline", raw),
        },
      };

      const allSteps = orderedIds
        .map((id) => stepById[id])
        .filter((x): x is Step => Boolean(x));
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
        const missingFieldsNow = allSteps
          .filter(
            (s) =>
              s.when(answers) &&
              (answers[s.id] === undefined || answers[s.id] === null)
          )
          .map((s) => s.id);

        const riskFlags: string[] = [];
        if (answers.contract === false) riskFlags.push("no_contract");
        if (answers.relationship === "unknown") riskFlags.push("unknown_counterparty");
        if (
          typeof answers.amount === "number" &&
          typeof answers.income === "number" &&
          Number.isFinite(answers.income) &&
          answers.income > 0 &&
          answers.amount > answers.income
        ) {
          riskFlags.push("high_amount_vs_income");
        }

        const aiFollowUps = await generateFollowUpQuestions(
          answers as Partial<AnalyzeAnswers>,
          scenario,
          resolvedLanguage
        );

        const aiAdaptive = await generateAdaptiveQuestion({
          scenario,
          answers: answers as Partial<AnalyzeAnswers>,
          missingFields: missingFieldsNow,
          riskFlags,
          language: resolvedLanguage,
        });

        const adaptiveStep = aiAdaptive
          ? stepById[aiAdaptive.id as AnalyzeMissingField]
          : null;

        const prioritizedFollowUp = aiFollowUps
          .map((q) => stepById[q.id as AnalyzeMissingField] ?? null)
          .find(
            (s): s is Step => {
              if (!s) return false;
              return (
                s.when(answers) &&
                (answers[s.id] === undefined || answers[s.id] === null)
              );
            }
          );

        const nextStep =
          (adaptiveStep &&
          adaptiveStep.when(answers) &&
          (answers[adaptiveStep.id] === undefined || answers[adaptiveStep.id] === null)
            ? adaptiveStep
            : null) ??
          prioritizedFollowUp ??
          allSteps.find(
            (s) =>
              s.when(answers) &&
              (answers[s.id] === undefined || answers[s.id] === null)
          );

        const getAdaptiveQuestionText = (fieldId: AnalyzeMissingField) => {
          if (aiAdaptive && aiAdaptive.id === fieldId) return aiAdaptive.text;
          const fromAi = aiFollowUps.find((q) => q.id === fieldId)?.text;
          return typeof fromAi === "string" && fromAi.trim().length > 0
            ? fromAi
            : buildQuestionText(fieldId);
        };

        if (!nextStep) {
          // All required answers are present
          const amountNum = Number(answers.amount);
          const incomeNum = Number(answers.income);
          const deadlineNum = Number(answers.deadline);
          const relationshipSafe = answers.relationship === "unknown" ? "unknown" : "known";

          if (
            !Number.isFinite(amountNum) ||
            amountNum < 0 ||
            !Number.isFinite(incomeNum) ||
            incomeNum < 0 ||
            !Number.isFinite(deadlineNum) ||
            deadlineNum < 0
          ) {
            const fallbackQuestion =
              !Number.isFinite(amountNum) || amountNum < 0
                ? "amount"
                : !Number.isFinite(incomeNum) || incomeNum < 0
                  ? "income"
                  : "deadline";
            const text = buildQuestionText(fallbackQuestion);
            const progress = Math.round((answeredCount() / totalSteps) * 100);
            return NextResponse.json({ text, missingField: fallbackQuestion, progress });
          }

          const inputData: RiskInputData = {
            amount: amountNum,
            income: incomeNum,
            contract: Boolean(answers.contract),
            relationship: relationshipSafe,
            deadline: deadlineNum,
          };

          const scoring = calculateRisk(answers as AnalyzeAnswers, scenario, resolvedLanguage);
          const simulation = simulateScenarios(
            answers as AnalyzeAnswers,
            scenario,
            resolvedLanguage
          );
          const contradictions = detectContradictions(
            answers as Partial<AnalyzeAnswers>,
            resolvedLanguage
          );
          const behavior = evaluateBehavioralRisk(
            answers as Partial<AnalyzeAnswers>
          );
          // "AI thinking" delay for better UX (typing animation is already active client-side).
          await sleep(650);

          const aiOut = await generateRiskAIExplanation({
            language: resolvedLanguage,
            analysisType: scenario,
            answers: answers as AnalyzeAnswers,
            scoring,
            simulation,
            contradictions,
            behavioralRisk: behavior.risk,
          });

          await sleep(350);

          const baseScore = Math.max(
            0,
            Math.min(100, Number(scoring.score) || 0)
          );
          const aiScore = Math.max(
            0,
            Math.min(
              100,
              Number(
                aiOut?.aiScore ??
                  Math.round(
                    (Number(aiOut?.dealRisk ?? scoring.dealRiskScore) * 0.6) +
                      (Number(aiOut?.userRisk ?? scoring.userCapacityScore) * 0.4)
                  )
              ) || 0
            )
          );
          const contradictionPenalty = Math.max(
            0,
            Math.min(
              100,
              Number(contradictions.penalty) || 0
            )
          );
          const behaviorRisk = Math.max(
            0,
            Math.min(100, Number(behavior.risk) || 0)
          );

          const aiDiff = Math.abs(aiScore - baseScore);
          const fallbackHybrid = aiDiff > 40;
          const finalRisk = Math.max(
            0,
            Math.min(
              100,
              Math.round(
                fallbackHybrid
                  ? baseScore * 0.7 +
                      aiScore * 0.1 +
                      behaviorRisk * 0.1 +
                      contradictionPenalty * 0.1
                  : baseScore * 0.5 +
                      aiScore * 0.3 +
                      behaviorRisk * 0.1 +
                      contradictionPenalty * 0.1
              )
            )
          );

          const finalVerdict =
            finalRisk >= 70 ? "HIGH RISK" : finalRisk >= 45 ? "CAUTION" : "SAFE";

          const inconsistentData =
            (Number(answers.amount ?? 0) > Number(answers.income ?? 0) * 3 &&
              answers.repayment_plan === "aggressive") ||
            (answers.relationship === "unknown" &&
              answers.identity_verified === "not_verified" &&
              answers.contract === false);

          const finalConfidence = calculateConfidence({
            answers: answers as Partial<AnalyzeAnswers>,
            contradictionsCount: contradictions.contradictions.length,
            inconsistentData,
          });

          const out = {
            // Existing fields required by UI/dashboard
            risk: finalRisk,
            verdict: finalVerdict,
            confidence: finalConfidence,
            reasons: aiOut?.reasons?.length ? aiOut.reasons : scoring.reasons,
            language: resolvedLanguage,

            // Upgraded result engine output
            dealRisk: aiOut ? aiOut.dealRisk : scoring.dealRiskScore,
            userRisk: aiOut ? aiOut.userRisk : scoring.userCapacityScore,
            totalRisk: finalRisk,
            verdictDetail: aiOut?.verdict || finalVerdict,
            keyRisks: aiOut?.reasons?.length ? aiOut.reasons : scoring.keyRisks,
            explanation: aiOut?.explanation || scoring.explanation,
            recommendations: aiOut?.recommendations?.length ? aiOut.recommendations : scoring.recommendations,
            socialProof: scoring.socialProof,
            worstCaseRisk: simulation.worstCaseRisk,
            scenarios: simulation.scenarios,
            layers: {
              legal: scoring.layers.legal,
              financial: scoring.layers.financial,
              behavioral: behaviorRisk,
            },
            contradictions: contradictions.contradictions,

            baseRisk: baseScore,
            aiRisk: aiScore,
            finalRisk,
            interactionBonus: scoring.interactionBonus,
            contradictionPenalty,
            behavioralRisk: behaviorRisk,
            selfCheckFallback: fallbackHybrid,
            analysisStages: [
              "Analyzing risk patterns...",
              "Checking financial stability...",
              "Simulating worst-case scenarios...",
            ],

            // Back-compat split scores
            dealRiskScore: scoring.dealRiskScore,
            userCapacityScore: scoring.userCapacityScore,

            // Store full answers for future personalization / audits
            answers: answers as AnalyzeAnswers,
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
          const text = getAdaptiveQuestionText(nextStep.id);
          const progress = Math.round((answeredCount() / totalSteps) * 100);
          return NextResponse.json({ text, missingField: nextStep.id as any, progress });
        }

        const rawAnswer = userMessages[userIndex]?.content ?? "";
        let parsed = nextStep.parse(rawAnswer);
        if (parsed === null || parsed === undefined) {
          // Fallback: normalize free-text answer with Claude so user can answer in own style.
          parsed = await parseAnalyzeValueWithAI(nextStep.id, rawAnswer);
        }
        if (parsed === null || parsed === undefined) {
          // Ask the same question again (user entered invalid format)
          const text = getAdaptiveQuestionText(nextStep.id);
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
        stream: wantsStream,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errData?.error?.message || `Upstream error ${response.status}` },
        { status: response.status }
      );
    }

    if (wantsStream && response.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          const reader = response.body!.getReader();
          let buffer = "";
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const payload = trimmed.slice(5).trim();
                if (!payload || payload === "[DONE]") continue;
                try {
                  const evt = JSON.parse(payload) as {
                    type?: string;
                    delta?: { text?: string };
                  };
                  if (evt.type === "content_block_delta" && evt.delta?.text) {
                    controller.enqueue(encoder.encode(evt.delta.text));
                  }
                } catch {
                  // ignore malformed event chunks
                }
              }
            }
          } finally {
            try {
              const rest = buffer.trim();
              if (rest.startsWith("data:")) {
                const payload = rest.slice(5).trim();
                if (payload && payload !== "[DONE]") {
                  const evt = JSON.parse(payload) as { type?: string; delta?: { text?: string } };
                  if (evt.type === "content_block_delta" && evt.delta?.text) {
                    controller.enqueue(encoder.encode(evt.delta.text));
                  }
                }
              }
            } catch {
              // ignore tail parse errors
            }
            controller.close();
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    const data = await response.json();
    const rawText = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
    const text = enforceZinvestTone(rawText, resolvedLanguage);

    // Analyze mode is handled deterministically above (and returns early),
    // so at this point we can always return plain text.
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
