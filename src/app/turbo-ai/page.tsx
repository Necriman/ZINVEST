"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, ArrowLeft, BrainCircuit, User, 
  Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/sections/navigation";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import RiskResultCard, { type RiskResult } from "@/components/RiskResult";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

type ChatMode = "finance" | "analyze";

type AnalysisType =
  | "loan"
  | "installment"
  | "purchase"
  | "order"
  | "invest"
  | "longterm_invest";

type RiskField =
  | "amount"
  | "income"
  | "contract"
  | "relationship"
  | "deadline"
  | "contract_reason"
  | "identity_verified"
  | "past_defaults"
  | "transparency"
  | "urgency"
  | "collateral_provided"
  | "penalty_terms_present"
  | "delivery_reliability"
  | "guaranteed_return"
  | "repayment_plan"
  | "savings";

type Unit = {
  id: string;
  title: string;
  description: string;
  focus: string;
  questions: string[];
};

export default function TurboAIPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);
  const [riskField, setRiskField] = useState<RiskField | null>(null);
  const [hasRedirectedToDashboard, setHasRedirectedToDashboard] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const financeUnits: Unit[] = [
    {
      id: "revenue-vs-profit",
      title: "Выручка vs Прибыль",
      description: "Поймите разницу между выручкой и прибылью простыми словами.",
      focus: "Объясни разницу между выручкой и прибылью через понятные аналогии и примеры для новичков.",
      questions: [t.turboAIPage.q1],
    },
    {
      id: "compound-interest",
      title: "Сложный процент",
      description: "Поймите, как рост ускоряется со временем.",
      focus: "Объясни сложный процент интуитивно и на небольшом числовом примере.",
      questions: [t.turboAIPage.q2],
    },
    {
      id: "diversification",
      title: "Диверсификация",
      description: "Снижайте риск, распределяя вложения.",
      focus: "Объясни диверсификацию простыми словами и как она помогает снижать риск.",
      questions: [t.turboAIPage.q3],
    },
    {
      id: "balance-sheet",
      title: "Баланс",
      description: "Разберитесь в активах, обязательствах и капитале.",
      focus: "Объясни, что такое баланс, и покажи, как его читать.",
      questions: [t.turboAIPage.q4],
    },
    {
      id: "cash-flow",
      title: "Денежный поток",
      description: "Отслеживайте деньги «внутрь» и «наружу» (и почему это может отличаться от прибыли).",
      focus: "Свяжи понятия денежного потока с реальными ситуациями и объясни, почему важны деньги.",
      questions: ["Что такое денежный поток и чем он отличается от прибыли?"],
    },
    {
      id: "budgeting",
      title: "Бюджетирование",
      description: "Соберите понятный план управления деньгами для новичка.",
      focus: "Помоги пользователю построить простую систему бюджетирования и объясни, как начать.",
      questions: ["Как начать бюджетирование с нуля?"],
    },
  ];

  const generalSuggestedQuestions = [
    "Как быстрее разобраться в этой теме?",
    "Объясни эту концепцию так, будто я только начинаю.",
    "Дай практичный пошаговый план.",
    "Помоги придумать идеи для моего проекта.",
  ];

  const [mode, setMode] = useState<ChatMode>("finance");

  const analyzeLabels = {
    relationshipKnown:
      language === "en" ? "Known" : language === "uz" ? "Ma'lum" : "Известно",
    relationshipUnknown:
      language === "en" ? "Unknown" : language === "uz" ? "Noma'lum" : "Неизвестно",
    contractYes: language === "en" ? "Yes" : language === "uz" ? "Ha" : "Да",
    contractNo: language === "en" ? "No" : language === "uz" ? "Yo'q" : "Нет",
    contractReasonVerbal:
      language === "en" ? "Only verbal/oral" : language === "uz" ? "Faqat og'zaki" : "Только устные условия",
    contractReasonMissingTerms:
      language === "en" ? "No clear written terms" : language === "uz" ? "Aniq yozma shartlar yo'q" : "Нет понятных письменных условий",
    contractReasonNotSure:
      language === "en" ? "Not sure" : language === "uz" ? "Aniq emas" : "Не уверен(а)",
    identityVerified:
      language === "en" ? "Verified" : language === "uz" ? "Tasdiqlangan" : "Подтверждено",
    identityPartial:
      language === "en" ? "Partial" : language === "uz" ? "Qisman" : "Частично",
    identityNotVerified:
      language === "en" ? "Not verified" : language === "uz" ? "Tasdiqlanmagan" : "Не подтверждено",
    pastNever:
      language === "en" ? "Never" : language === "uz" ? "Hech qachon" : "Никогда",
    pastOnce:
      language === "en" ? "Once" : language === "uz" ? "Bir marta" : "Один раз",
    pastMany:
      language === "en" ? "Multiple times" : language === "uz" ? "Ko'p marta" : "Были многократно",
    transparencyHigh:
      language === "en" ? "High" : language === "uz" ? "Yuqori" : "Высокая",
    transparencyMedium:
      language === "en" ? "Medium" : language === "uz" ? "O'rtacha" : "Средняя",
    transparencyLow:
      language === "en" ? "Low" : language === "uz" ? "Past" : "Низкая",
    urgencyLow:
      language === "en" ? "Low" : language === "uz" ? "Past" : "Низкое",
    urgencyMedium:
      language === "en" ? "Medium" : language === "uz" ? "O'rtacha" : "Среднее",
    urgencyHigh:
      language === "en" ? "High" : language === "uz" ? "Yuqori" : "Высокое",
    yesRisk: language === "en" ? "Yes" : language === "uz" ? "Ha" : "Да",
    noRisk: language === "en" ? "No" : language === "uz" ? "Yo'q" : "Нет",
    deliveryReliable:
      language === "en" ? "Reliable" : language === "uz" ? "Ishonchli" : "Надежно",
    deliveryUncertain:
      language === "en" ? "Uncertain" : language === "uz" ? "Noaniq" : "Неясно",
    deliveryUnknown:
      language === "en" ? "Unknown" : language === "uz" ? "Noma'lum" : "Неизвестно",
    repaymentConservative:
      language === "en" ? "Conservative" : language === "uz" ? "Konservativ" : "Консервативно",
    repaymentModerate:
      language === "en" ? "Moderate" : language === "uz" ? "O'rtacha" : "Умеренно",
    repaymentAggressive:
      language === "en" ? "Aggressive" : language === "uz" ? "Agressiv" : "Агрессивно",
    placeholderAnalyze:
      language === "en"
        ? "Answer step-by-step (chips or manual input)."
        : language === "uz"
          ? "Savollarni ketma-ket javob bering (chips yoki matn)."
          : "Ответьте по шагам (кнопки или вручную).",
    choosingMsg:
      language === "en"
        ? "Choose answer for the current question:"
        : language === "uz"
          ? "Joriy savol uchun javobni tanlang:"
          : "Выберите ответ для текущего вопроса:",
  };
  useEffect(() => {
    // Next.js 15 requires Suspense for useSearchParams(). We instead read from window.
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get("mode");
    if (modeParam === "analyze") setMode("analyze");
    if (modeParam === "finance") setMode("finance");
  }, []);
  const [activeUnitId, setActiveUnitId] = useState<string>(
    financeUnits[0]?.id ?? "revenue-vs-profit"
  );

  const activeUnit = financeUnits.find((u) => u.id === activeUnitId) ?? financeUnits[0];

  function safeParseJson(raw: string): any | null {
    try {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Restart the conversation when mode/unit changes so the prompt context matches.
    setMessages([]);
    setIsTyping(false);
    setInput("");
    setRiskResult(null);
    setRiskField(null);
    setAnalysisProgress(0);
    setHasRedirectedToDashboard(false);
    if (mode !== "analyze") setAnalysisType(null);
  }, [mode, activeUnitId]);

  useEffect(() => {
    if (mode !== "analyze") return;
    if (!riskResult) return;
    if (hasRedirectedToDashboard) return;

    setHasRedirectedToDashboard(true);
    const timer = window.setTimeout(() => {
      router.push("/dashboard?risk=latest");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [mode, riskResult, hasRedirectedToDashboard, router]);

  const handleSend = async (text: string) => {
    const userText = text.trim();
    if (!userText || isTyping) return;

    setInput("");
    const userMessage: Message = { id: Date.now(), role: "user", content: userText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({ role, content })),
          mode,
          unit: mode === "finance" ? { title: activeUnit.title, focus: activeUnit.focus } : undefined,
          analysisType: mode === "analyze" ? analysisType : undefined,
          userId: user?.id ?? null,
          language,
        }),
      });

      const raw = await res.text();
      const data = safeParseJson(raw);

      if (!res.ok) {
        throw new Error(data?.error || raw || `Error ${res.status}`);
      }

      if (mode === "analyze" && typeof data?.risk === "number" && typeof data?.verdict === "string") {
        setRiskResult({
          risk: data.risk,
          verdict: data.verdict,
          confidence: data.confidence ?? 0,
          reasons: Array.isArray(data.reasons) ? data.reasons : [],
          inputData: data.inputData ?? data.input_data ?? undefined,
          language: data.language ?? language,
        });
        setRiskField(null);
        return;
      }

      if (mode === "analyze") {
        const rawField = data?.missingField;
        const nextField: RiskField | null =
          typeof rawField === "string" &&
          (rawField === "amount" ||
            rawField === "income" ||
            rawField === "contract" ||
            rawField === "relationship" ||
            rawField === "deadline" ||
            rawField === "contract_reason" ||
            rawField === "identity_verified" ||
            rawField === "past_defaults" ||
            rawField === "transparency" ||
            rawField === "urgency" ||
            rawField === "collateral_provided" ||
            rawField === "penalty_terms_present" ||
            rawField === "delivery_reliability" ||
            rawField === "guaranteed_return" ||
            rawField === "repayment_plan" ||
            rawField === "savings")
            ? (rawField as RiskField)
            : null;
        setRiskField(nextField);
        if (typeof data?.progress === "number") {
          setAnalysisProgress(Math.max(0, Math.min(100, data.progress)));
        } else {
          setAnalysisProgress(0);
        }
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data?.text || (typeof raw === "string" && raw ? raw : "Не удалось сгенерировать ответ. Попробуйте ещё раз."),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Zinvest AI error:", err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Что-то пошло не так. Попробуйте ещё раз.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1c] flex flex-col">
      <Navigation />
      
      <div className="flex-1 flex flex-col pt-24 pb-6 px-4 md:px-6">
        <div className="flex-1 mx-auto w-full max-w-4xl flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="h-4 w-4" />
              {t.turboAIPage.backToHome}
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{t.turboAIPage.title}</h1>
                <p className="text-sm text-slate-400">{t.turboAIPage.subtitle}</p>
              </div>
            </div>
          </motion.div>

          {/* Mode + Topic Units */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => {
                  setMode("finance");
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  mode === "finance"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                Финансовый репетитор
              </button>
              <button
                onClick={() => {
                  setMode("analyze");
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  mode === "analyze"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                Оценка риска
              </button>
            </div>

            {mode === "finance" && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {financeUnits.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setActiveUnitId(u.id)}
                    className={`min-w-[220px] text-left rounded-2xl border p-4 transition-all ${
                      activeUnitId === u.id
                        ? "border-blue-500/30 bg-blue-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-semibold text-white">{u.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">{u.description}</p>
                  </button>
                ))}
              </div>
            )}

            {mode === "analyze" && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {(
                  [
                    { type: "loan" as const, title: "💸 Займ" },
                    { type: "installment" as const, title: "🏦 Рассрочка" },
                    { type: "purchase" as const, title: "🛒 Покупка" },
                    { type: "order" as const, title: "📦 Заказ/поставка" },
                    { type: "invest" as const, title: "📈 Инвестирование" },
                    {
                      type: "longterm_invest" as const,
                      title: "🧩 Долгосрочные вложения",
                    },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.type + c.title}
                    onClick={() => {
                      setAnalysisType(c.type);
                      setRiskResult(null);
                      setRiskField(null);
                      setMessages([]);
                      setInput("");

                      const seedMessage: Message = {
                        id: Date.now(),
                        role: "user",
                        content: `Я выбрал: ${c.title}. Начинаем оценку риска. Задавай вопросы, чтобы собрать структурированные данные для точной оценки риска.`,
                      };
                      const nextMessages = [seedMessage];
                      setMessages(nextMessages);

                      void (async () => {
                        setIsTyping(true);
                        try {
                          const res = await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              messages: nextMessages.map(({ role, content }) => ({
                                role,
                                content,
                              })),
                              mode: "analyze",
                              analysisType: c.type,
                              userId: user?.id ?? null,
                              language,
                            }),
                          });

                          const raw = await res.text();
                          const data = safeParseJson(raw);
                          if (!res.ok) throw new Error(data?.error || raw || `Error ${res.status}`);

                          if (typeof data?.risk === "number" && typeof data?.verdict === "string") {
                            setRiskResult({
                              risk: data.risk,
                              verdict: data.verdict,
                              confidence: data.confidence ?? 0,
                              reasons: Array.isArray(data.reasons) ? data.reasons : [],
                              inputData: data.inputData ?? data.input_data ?? undefined,
                              language: data.language ?? language,
                            });
                            setRiskField(null);
                            setAnalysisProgress(100);
                          } else {
                            const rawField = data?.missingField;
                            if (
                              typeof rawField === "string" &&
                              (rawField === "amount" ||
                                rawField === "income" ||
                                rawField === "contract" ||
                                rawField === "relationship" ||
                                rawField === "deadline" ||
                                rawField === "contract_reason" ||
                                rawField === "identity_verified" ||
                                rawField === "past_defaults" ||
                                rawField === "transparency" ||
                                rawField === "urgency" ||
                                rawField === "collateral_provided" ||
                                rawField === "penalty_terms_present" ||
                                rawField === "delivery_reliability" ||
                                rawField === "guaranteed_return" ||
                                rawField === "repayment_plan" ||
                                rawField === "savings")
                            ) {
                              setRiskField(rawField);
                              if (typeof data?.progress === "number") {
                                setAnalysisProgress(
                                  Math.max(0, Math.min(100, data.progress))
                                );
                              } else {
                                setAnalysisProgress(0);
                              }
                            } else {
                              setRiskField(null);
                              setAnalysisProgress(0);
                            }

                            const assistantMessage: Message = {
                              id: Date.now() + 1,
                              role: "assistant",
                              content:
                                data?.text ||
                                (typeof raw === "string" && raw
                                  ? raw
                                  : "Понял. Ответьте на следующий вопрос."),
                            };
                            setMessages((prev) => [...prev, assistantMessage]);
                          }
                        } catch (err) {
                          console.error("Risk scoring seed error:", err);
                          const assistantMessage: Message = {
                            id: Date.now() + 1,
                            role: "assistant",
                            content: "Что-то пошло не так. Попробуйте ещё раз.",
                          };
                          setMessages((prev) => [...prev, assistantMessage]);
                        } finally {
                          setIsTyping(false);
                        }
                      })();
                    }}
                    className={`min-w-[240px] text-left rounded-2xl border p-4 transition-all ${
                      analysisType === c.type
                        ? "border-purple-500/30 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">{c.title}</span>
                    </div>
                    <p className="text-xs text-slate-400">Ответьте короткими фактами, чтобы получить оценку риска.</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 mb-6">
                    <BrainCircuit className="h-8 w-8 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">{t.turboAIPage.emptyTitle}</h2>
                  <p className="text-slate-400 max-w-md mb-8">
                    {t.turboAIPage.emptySubtitle}
                  </p>
                  
                  {/* Suggested Questions */}
                  {mode === "finance" ? (
                    <div className="grid gap-3 w-full max-w-lg">
                      {activeUnit.questions.map((question, idx) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => handleSend(question)}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-300 transition-all hover:bg-white/10 hover:border-white/20"
                        >
                          <Lightbulb className="h-4 w-4 text-blue-400 shrink-0" />
                          {question}
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400 max-w-md">
                      Выберите сценарий выше, чтобы начать оценку риска.
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  {riskResult ? (
                    <div className="px-1">
                      <RiskResultCard result={riskResult} />
                      <div className="pt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => {
                            if (!analysisType) return;
                            setRiskResult(null);
                            setRiskField(null);
                            setInput("");

                            const title =
                              analysisType === "loan"
                                ? "💸 Займ"
                                : analysisType === "installment"
                                  ? "🏦 Рассрочка"
                                  : analysisType === "purchase"
                                    ? "🛒 Покупка"
                                    : analysisType === "order"
                                      ? "📦 Заказ/поставка"
                                      : analysisType === "invest"
                                        ? "📈 Инвестирование"
                                        : "🧩 Долгосрочные вложения";

                            const seedMessage: Message = {
                              id: Date.now(),
                              role: "user",
                              content: `Я выбрал: ${title}. Начинаем оценку риска заново. Задавай вопросы, чтобы собрать структурированные данные для точной оценки риска.`,
                            };
                            const nextMessages = [seedMessage];
                            setMessages(nextMessages);

                            setIsTyping(true);
                            void (async () => {
                              try {
                                const res = await fetch("/api/chat", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    messages: nextMessages.map(({ role, content }) => ({
                                      role,
                                      content,
                                    })),
                                    mode: "analyze",
                                    analysisType,
                                    userId: user?.id ?? null,
                                    language,
                                  }),
                                });

                                const raw = await res.text();
                                const data = safeParseJson(raw);
                                if (!res.ok) throw new Error(data?.error || raw || `Error ${res.status}`);

                                if (typeof data?.risk === "number" && typeof data?.verdict === "string") {
                                  setRiskResult({
                                    risk: data.risk,
                                    verdict: data.verdict,
                                    confidence: data.confidence ?? 0,
                                    reasons: Array.isArray(data.reasons) ? data.reasons : [],
                                    inputData: data.inputData ?? data.input_data ?? undefined,
                                    language: data.language ?? language,
                                  });
                                  setAnalysisProgress(100);
                                  setRiskField(null);
                                  return;
                                }

                                if (typeof data?.missingField === "string") {
                                  const rawField = data.missingField;
                                  if (
                                    rawField === "amount" ||
                                    rawField === "income" ||
                                    rawField === "contract" ||
                                    rawField === "relationship" ||
                                    rawField === "deadline" ||
                                    rawField === "contract_reason" ||
                                    rawField === "identity_verified" ||
                                    rawField === "past_defaults" ||
                                    rawField === "transparency" ||
                                    rawField === "urgency" ||
                                    rawField === "collateral_provided" ||
                                    rawField === "penalty_terms_present" ||
                                    rawField === "delivery_reliability" ||
                                    rawField === "guaranteed_return" ||
                                    rawField === "repayment_plan" ||
                                    rawField === "savings"
                                  ) {
                                    setRiskField(rawField);
                                    if (typeof data?.progress === "number") {
                                      setAnalysisProgress(Math.max(0, Math.min(100, data.progress)));
                                    } else {
                                      setAnalysisProgress(0);
                                    }
                                  } else {
                                    setRiskField(null);
                                    setAnalysisProgress(0);
                                  }
                                } else {
                                  setRiskField(null);
                                  setAnalysisProgress(0);
                                }

                                const assistantMessage: Message = {
                                  id: Date.now() + 1,
                                  role: "assistant",
                                  content:
                                    data?.text ||
                                    (typeof raw === "string" && raw ? raw : "Понял. Ответьте на следующий вопрос."),
                                };
                                setMessages((prev) => [...prev, assistantMessage]);
                              } catch (err) {
                                console.error("Restart risk scoring error:", err);
                                const assistantMessage: Message = {
                                  id: Date.now() + 1,
                                  role: "assistant",
                                  content: "Что-то пошло не так. Попробуйте ещё раз.",
                                };
                                setMessages((prev) => [...prev, assistantMessage]);
                              } finally {
                                setIsTyping(false);
                              }
                            })();
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                          Начать заново
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <AnimatePresence mode="popLayout">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex items-start gap-3 max-w-[85%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            message.role === "user" ? "bg-blue-500" : "bg-blue-500/20"
                          }`}>
                            {message.role === "user" ? (
                              <User className="h-4 w-4 text-white" />
                            ) : (
                              <Sparkles className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : mode === "analyze"
                                ? "bg-purple-500/10 border border-purple-500/20 text-slate-200 rounded-tl-none"
                                : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none"
                          }`}>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-invert prose-sm max-w-none">
                              {message.content.split('\n').map((line, i) => {
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return <p key={i} className="font-bold text-white my-1">{line.replace(/\*\*/g, '')}</p>;
                                }
                                if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
                                  return <p key={i} className="italic text-blue-400 my-1">{line.replace(/\*/g, '')}</p>;
                                }
                                if (line.startsWith('- ')) {
                                  return <p key={i} className="ml-4 my-0.5">• {line.substring(2)}</p>;
                                }
                                return <p key={i} className="my-1">{line}</p>;
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20">
                          <Sparkles className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-4">
              {mode === "analyze" && riskField && !riskResult ? (
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={false}
                      animate={{ width: `${analysisProgress}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{analyzeLabels.choosingMsg}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {riskField === "relationship" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("known")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🤝 {analyzeLabels.relationshipKnown}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("unknown")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🕵️ {analyzeLabels.relationshipUnknown}
                        </button>
                      </>
                    ) : null}

                    {riskField === "contract" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("true")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          📝 {analyzeLabels.contractYes}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("false")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⛔ {analyzeLabels.contractNo}
                        </button>
                      </>
                    ) : null}

                    {riskField === "contract_reason" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("verbal")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗣️ {analyzeLabels.contractReasonVerbal}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("missing_terms")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🧾 {analyzeLabels.contractReasonMissingTerms}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("not_sure")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🤷 {analyzeLabels.contractReasonNotSure}
                        </button>
                      </>
                    ) : null}

                    {riskField === "identity_verified" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("verified")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✅ {analyzeLabels.identityVerified}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("partial")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🟨 {analyzeLabels.identityPartial}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("not_verified")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ❌ {analyzeLabels.identityNotVerified}
                        </button>
                      </>
                    ) : null}

                    {riskField === "past_defaults" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("never")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          📌 {analyzeLabels.pastNever}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("once")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⚠️ {analyzeLabels.pastOnce}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("many")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🚨 {analyzeLabels.pastMany}
                        </button>
                      </>
                    ) : null}

                    {riskField === "transparency" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("high")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🧾 {analyzeLabels.transparencyHigh}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("medium")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🟨 {analyzeLabels.transparencyMedium}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("low")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🕳️ {analyzeLabels.transparencyLow}
                        </button>
                      </>
                    ) : null}

                    {riskField === "urgency" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("low")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🧘 {analyzeLabels.urgencyLow}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("medium")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⏳ {analyzeLabels.urgencyMedium}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("high")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🚨 {analyzeLabels.urgencyHigh}
                        </button>
                      </>
                    ) : null}

                    {riskField === "collateral_provided" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("true")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🛡️ {analyzeLabels.yesRisk}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("false")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⛔ {analyzeLabels.noRisk}
                        </button>
                      </>
                    ) : null}

                    {riskField === "penalty_terms_present" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("true")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⚖️ {analyzeLabels.yesRisk}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("false")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⛔ {analyzeLabels.noRisk}
                        </button>
                      </>
                    ) : null}

                    {riskField === "delivery_reliability" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("reliable")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          📦 {analyzeLabels.deliveryReliable}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("uncertain")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🟨 {analyzeLabels.deliveryUncertain}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("unknown")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ❓ {analyzeLabels.deliveryUnknown}
                        </button>
                      </>
                    ) : null}

                    {riskField === "guaranteed_return" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("true")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⚠️ {analyzeLabels.yesRisk}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("false")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ✅ {analyzeLabels.noRisk}
                        </button>
                      </>
                    ) : null}

                    {riskField === "repayment_plan" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("conservative")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🧠 {analyzeLabels.repaymentConservative}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("moderate")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⚖️ {analyzeLabels.repaymentModerate}
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("aggressive")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🔥 {analyzeLabels.repaymentAggressive}
                        </button>
                      </>
                    ) : null}

                    {riskField === "savings" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("1000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💼 1000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("5000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💼 5000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("10000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💼 10000
                        </button>
                      </>
                    ) : null}

                    {riskField === "amount" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("1000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💰 1000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("5000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💰 5000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("10000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          💰 10000
                        </button>
                      </>
                    ) : null}

                    {riskField === "income" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("2000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          👤 2000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("5000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          👤 5000
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("10000")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          👤 10000
                        </button>
                      </>
                    ) : null}

                    {riskField === "deadline" ? (
                      <>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("14")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⏳ 14 дней
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("30")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⏳ 30 дней
                        </button>
                        <button
                          type="button"
                          disabled={isTyping}
                          onClick={() => handleSend("60")}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ⏳ 60 дней
                        </button>
                      </>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2 text-center">
                    Если нет подходящего варианта — введите ответ вручную.
                  </p>
                </div>
              ) : null}

              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === "finance"
                      ? t.turboAIPage.placeholder
                      : analyzeLabels.placeholderAnalyze
                  }
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                <button 
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping || (mode === "analyze" && !!riskResult)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white transition-all hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2 text-center">
                {mode === "finance"
                  ? t.turboAIPage.disclaimer
                  : "Объяснения ИИ предназначены для обучения. Для профессиональных решений проконсультируйтесь с квалифицированным специалистом."}
              </p>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
