"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, BrainCircuit, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import Navigation from "@/components/sections/navigation";
import { useAuth } from "@/lib/auth-context";
import RiskResultCard, { type RiskResult } from "@/components/RiskResult";

type AnalysisType =
  | "loan"
  | "installment"
  | "purchase"
  | "order"
  | "invest"
  | "longterm_invest";

type RiskField = "amount" | "income" | "contract" | "relationship" | "deadline";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

function analysisTitle(t: AnalysisType) {
  switch (t) {
    case "loan":
      return "💸 Займ";
    case "installment":
      return "🏦 Рассрочка";
    case "purchase":
      return "🛒 Покупка";
    case "order":
      return "📦 Заказ/поставка";
    case "invest":
      return "📈 Инвестирование";
    case "longterm_invest":
      return "🧩 Долгосрочные вложения";
  }
}

export default function AnalyzePage() {
  const router = useRouter();
  const [redirecting] = useState(true);

  useEffect(() => {
    router.replace("/turbo-ai?mode=analyze");
  }, [router]);

  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [riskField, setRiskField] = useState<RiskField | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const cards = useMemo(
    () =>
      [
        {
          type: "loan" as const,
          title: "💸 Займ",
          description: "Оцените, насколько рискован заемщик.",
        },
        {
          type: "installment" as const,
          title: "🏦 Рассрочка",
          description: "Оценка риска при оплате в рассрочку.",
        },
        {
          type: "purchase" as const,
          title: "🛒 Покупка",
          description: "Оценка риска для сроков доставки/оплаты.",
        },
        {
          type: "order" as const,
          title: "📦 Заказ/поставка",
          description: "Оценка риска для условий заказа и поставки.",
        },
        {
          type: "invest" as const,
          title: "📈 Инвестирование",
          description: "Оценка факторов риска за решением.",
        },
        {
          type: "longterm_invest" as const,
          title: "🧩 Долгосрочные вложения",
          description: "Оцените риски на горизонте долгосрочного решения.",
        },
      ] as const,
    []
  );

  async function requestAssistant(nextMessages: ChatMessage[], type: AnalysisType) {
    setIsTyping(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          mode: "analyze",
          analysisType: type,
          userId,
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.error || raw || `Analyze failed with status ${res.status}`;
        throw new Error(msg);
      }

      const isRiskResult =
        data &&
        typeof data === "object" &&
        typeof data.risk === "number" &&
        typeof data.verdict === "string" &&
        typeof data.confidence === "number";

      if (isRiskResult) {
        setResult({
          risk: data.risk,
          verdict: data.verdict,
          confidence: data.confidence,
          reasons: Array.isArray(data.reasons) ? data.reasons : [],
        });
        setRiskField(null);
        return;
      }

      const rawField = data?.missingField;
      const nextField: RiskField | null =
        typeof rawField === "string" &&
        (rawField === "amount" ||
          rawField === "income" ||
          rawField === "contract" ||
          rawField === "relationship" ||
          rawField === "deadline")
          ? (rawField as RiskField)
          : null;
      setRiskField(nextField);

      const assistantText = data?.text || "Понял. Ответьте на следующий вопрос.";
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantText,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Analyze AI error:", err);
      setErrorMsg("Что-то пошло не так. Попробуйте ещё раз.");
    } finally {
      setIsTyping(false);
    }
  }

  const startAnalysis = async (t: AnalysisType) => {
    setAnalysisType(t);
    setMessages([]);
    setInput("");
    setResult(null);
    setRiskField(null);
    setErrorMsg(null);

    const seed: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: `Я выбрал: ${analysisTitle(t)}. Начинаем оценку риска. Задавай вопросы, чтобы собрать структурированные данные для точной оценки риска.`,
    };
    const next = [seed];
    setMessages(next);
    await requestAssistant(next, t);
  };

  const handleSend = async (textOverride?: string) => {
    const userText = (textOverride ?? input).trim();
    if (!userText || isTyping || !analysisType) return;
    setInput("");

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: userText,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    await requestAssistant(nextMessages, analysisType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const resetToMode = () => {
    setAnalysisType(null);
    setMessages([]);
    setResult(null);
    setRiskField(null);
    setInput("");
    setErrorMsg(null);
  };

  if (redirecting) {
    return (
      <main className="min-h-screen bg-[#0a0f1c] flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center text-slate-300 px-4">
          Перенаправляем в главное меню...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0f1c] flex flex-col">
      <Navigation />
      <div className="flex-1 flex flex-col pt-24 pb-6 px-4 md:px-6">
        <div className="flex-1 mx-auto w-full max-w-4xl flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              На главную
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Оценка риска</h1>
                <p className="text-sm text-slate-400">
                  Выберите сценарий и ответьте на несколько вопросов.
                </p>
              </div>
            </div>
          </motion.div>

          {!analysisType ? (
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {cards.map((c) => (
                <motion.button
                  key={c.type}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => void startAnalysis(c.type)}
                  className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{c.title}</h2>
                      <p className="text-sm text-slate-400 mt-1">{c.description}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
                      <span className="text-blue-300 text-lg">→</span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs text-slate-400">Сценарий</p>
                  <p className="text-white font-medium">{analysisTitle(analysisType)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={resetToMode}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Начать заново
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {errorMsg ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMsg}
                  </div>
                ) : null}

                {result ? (
                  <RiskResultCard result={result} />
                ) : (
                  <>
                    <AnimatePresence>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed border ${
                              m.role === "user"
                                ? "border-blue-500/30 bg-blue-500/10 text-white"
                                : "border-white/10 bg-white/5 text-slate-200"
                            }`}
                          >
                            {m.content}
                          </div>
                        </motion.div>
                      ))}
                      {isTyping ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start"
                        >
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-200 flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                            Идёт анализ...
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {!result ? (
                <div className="px-4 md:px-6 pb-5 pt-4 border-t border-white/10">
                  {riskField ? (
                    <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs text-slate-400 mb-2">
                        Выберите ответ для текущего вопроса:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {riskField === "relationship" ? (
                          <>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("известно")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              🤝 Известно
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("неизвестно")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              🕵️ Неизвестно
                            </button>
                          </>
                        ) : null}

                        {riskField === "contract" ? (
                          <>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("да")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              📝 Да
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("нет")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ⛔ Нет
                            </button>
                          </>
                        ) : null}

                        {riskField === "amount" ? (
                          <>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("1000")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              💰 1000
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("5000")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              💰 5000
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("10000")}
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
                              onClick={() => void handleSend("2000")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              👤 2000
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("5000")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              👤 5000
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("10000")}
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
                              onClick={() => void handleSend("14")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ⏳ 14 дней
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("30")}
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ⏳ 30 дней
                            </button>
                            <button
                              type="button"
                              disabled={isTyping}
                              onClick={() => void handleSend("60")}
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

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="text-xs text-slate-400">Ваш ответ</label>
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Например: я зарабатываю 2000 в месяц, срок 45 дней, есть договор... (или ответьте да/нет, известно/неизвестно)"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/40"
                        disabled={isTyping}
                      />
                    </div>
                    <button
                      onClick={() => void handleSend()}
                      disabled={isTyping || !input.trim()}
                      className="h-11 rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Отправить
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Подсказка: можно отвечать короткими фактами — AI извлечет структурированные данные.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

