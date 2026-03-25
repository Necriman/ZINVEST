"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Send, ArrowLeft, BrainCircuit, User, 
  Lightbulb
} from "lucide-react";
import Link from "next/link";
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

type AnalysisType = "loan" | "purchase" | "invest";

type Unit = {
  id: string;
  title: string;
  description: string;
  focus: string;
  questions: string[];
};

export default function TurboAIPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);
  const [riskResult, setRiskResult] = useState<RiskResult | null>(null);

  const financeUnits: Unit[] = [
    {
      id: "revenue-vs-profit",
      title: "Revenue vs Profit",
      description: "Learn the difference between revenue and profit with simple explanations.",
      focus: "Teach the difference between revenue and profit using clear, beginner-friendly analogies and examples.",
      questions: [t.turboAIPage.q1],
    },
    {
      id: "compound-interest",
      title: "Compound Interest",
      description: "Understand how growth accelerates over time.",
      focus: "Explain compound interest with intuition and a small numeric example.",
      questions: [t.turboAIPage.q2],
    },
    {
      id: "diversification",
      title: "Diversification",
      description: "Reduce risk by spreading exposure.",
      focus: "Explain diversification in simple terms and how it can reduce risk.",
      questions: [t.turboAIPage.q3],
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "Understand Assets, Liabilities, and Equity.",
      focus: "Explain what a balance sheet is and how to read it.",
      questions: [t.turboAIPage.q4],
    },
    {
      id: "cash-flow",
      title: "Cash Flow",
      description: "Track money in and out (and why it can differ from profit).",
      focus: "Connect cash flow concepts to real scenarios and explain why cash matters.",
      questions: ["What is cash flow and how is it different from profit?"],
    },
    {
      id: "budgeting",
      title: "Budgeting",
      description: "Build a beginner-friendly money plan.",
      focus: "Help the user build a simple budgeting framework and explain how to start.",
      questions: ["How do I start budgeting as a beginner?"],
    },
  ];

  const generalSuggestedQuestions = [
    "How can I learn this topic faster?",
    "Explain this concept like I'm new to it.",
    "Give me a practical step-by-step plan.",
    "Help me brainstorm ideas for my project.",
  ];

  const [mode, setMode] = useState<ChatMode>("finance");
  const [activeUnitId, setActiveUnitId] = useState<string>(
    financeUnits[0]?.id ?? "revenue-vs-profit"
  );

  const activeUnit = financeUnits.find((u) => u.id === activeUnitId) ?? financeUnits[0];

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
    if (mode !== "analyze") setAnalysisType(null);
  }, [mode, activeUnitId]);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status}`);
      }

      if (mode === "analyze" && typeof data?.risk === "number" && typeof data?.verdict === "string") {
        setRiskResult({
          risk: data.risk,
          verdict: data.verdict,
          confidence: data.confidence ?? 0,
          reasons: Array.isArray(data.reasons) ? data.reasons : [],
        });
        return;
      }

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.text || "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Zinvest AI error:", err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Something went wrong. Please try again.",
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
                onClick={() => setMode("finance")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  mode === "finance"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                Finance Tutor
              </button>
              <button
                onClick={() => setMode("analyze")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  mode === "analyze"
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                Risk Scoring
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
                    { type: "loan" as const, title: "💸 Give a loan" },
                    { type: "purchase" as const, title: "🛒 Make a purchase" },
                    { type: "invest" as const, title: "📈 Invest" },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.type}
                    onClick={() => {
                      setAnalysisType(c.type);
                      setRiskResult(null);
                      setMessages([]);
                      setInput("");

                      const seedMessage: Message = {
                        id: Date.now(),
                        role: "user",
                        content: `I selected: ${c.title}. Start AI risk scoring. Ask me the questions you need to collect structured inputs for an accurate risk score.`,
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
                            }),
                          });

                          const data = await res.json();
                          if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);

                          if (typeof data?.risk === "number" && typeof data?.verdict === "string") {
                            setRiskResult({
                              risk: data.risk,
                              verdict: data.verdict,
                              confidence: data.confidence ?? 0,
                              reasons: Array.isArray(data.reasons) ? data.reasons : [],
                            });
                          } else {
                            const assistantMessage: Message = {
                              id: Date.now() + 1,
                              role: "assistant",
                              content:
                                data?.text || "Got it. Please answer the next question.",
                            };
                            setMessages((prev) => [...prev, assistantMessage]);
                          }
                        } catch (err) {
                          console.error("Risk scoring seed error:", err);
                          const assistantMessage: Message = {
                            id: Date.now() + 1,
                            role: "assistant",
                            content: "Something went wrong. Please try again.",
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
                    <p className="text-xs text-slate-400">Answer short facts to get a risk verdict.</p>
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
                      Choose a scenario above to start risk scoring.
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
                            setInput("");

                            const title =
                              analysisType === "loan"
                                ? "💸 Give a loan"
                                : analysisType === "purchase"
                                  ? "🛒 Make a purchase"
                                  : "📈 Invest";

                            const seedMessage: Message = {
                              id: Date.now(),
                              role: "user",
                              content: `I selected: ${title}. Start AI risk scoring again. Ask me the questions you need to collect structured inputs for an accurate risk score.`,
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
                                  }),
                                });

                                const data = await res.json();
                                if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);

                                if (typeof data?.risk === "number" && typeof data?.verdict === "string") {
                                  setRiskResult({
                                    risk: data.risk,
                                    verdict: data.verdict,
                                    confidence: data.confidence ?? 0,
                                    reasons: Array.isArray(data.reasons) ? data.reasons : [],
                                  });
                                  return;
                                }

                                const assistantMessage: Message = {
                                  id: Date.now() + 1,
                                  role: "assistant",
                                  content: data?.text || "Got it. Please answer the next question.",
                                };
                                setMessages((prev) => [...prev, assistantMessage]);
                              } catch (err) {
                                console.error("Restart risk scoring error:", err);
                                const assistantMessage: Message = {
                                  id: Date.now() + 1,
                                  role: "assistant",
                                  content: "Something went wrong. Please try again.",
                                };
                                setMessages((prev) => [...prev, assistantMessage]);
                              } finally {
                                setIsTyping(false);
                              }
                            })();
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                          Restart scoring
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
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    mode === "finance"
                      ? t.turboAIPage.placeholder
                      : "Answer with short facts: amount, income, contract, relationship, deadline"
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
                  : "General AI explanations are for learning. For professional decisions, consult a qualified expert."}
              </p>
            </div>
          </div>
        </div>
      </div>

    </main>
  );
}
