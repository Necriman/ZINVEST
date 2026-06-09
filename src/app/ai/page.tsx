"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Send, Sparkles, ShieldAlert, PlusCircle, Lightbulb, TrendingUp, Banknote, BarChart3, Bot, User, Zap, Flame } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/sections/navigation";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";
import { useZiners, AI_QUESTION_COST } from "@/lib/ziners-context";

type Mode = "finance" | "analyze";
type ChatMessage = { id: string; role: "user" | "assistant"; content: string };
type ChatHistoryItem = { id: string; title: string; messages: ChatMessage[]; updatedAt: string };

const STORAGE: Record<Mode, string> = {
  finance: "zinvest-ai-history-finance",
  analyze: "zinvest-ai-history-analyze",
};
const LEGACY_HISTORY_KEY = "zinvest-ai-history";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const FINANCE_PROMPTS = [
  { icon: <Banknote className="h-3.5 w-3.5" />, text: "What is the difference between revenue and profit?" },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "How do I start investing with $500?" },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, text: "Explain cash flow in simple terms" },
  { icon: <Lightbulb className="h-3.5 w-3.5" />, text: "What is compound interest and why does it matter?" },
  { icon: <Banknote className="h-3.5 w-3.5" />, text: "How to read a balance sheet?" },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "What is a P/E ratio and how is it used?" },
];

const ANALYZE_PROMPTS = [
  { icon: <ShieldAlert className="h-3.5 w-3.5" />, text: "Analyze the risk of a startup investment" },
  { icon: <BarChart3 className="h-3.5 w-3.5" />, text: "What are the risks of taking a large loan?" },
  { icon: <TrendingUp className="h-3.5 w-3.5" />, text: "Assess risk: investing all savings in crypto" },
  { icon: <Lightbulb className="h-3.5 w-3.5" />, text: "Risk analysis of a small business expansion" },
];

export default function AIPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { coins, streak, spendCoins, recordActivity } = useZiners();
  const [mode, setMode] = useState<Mode>("finance");
  const [insufficientCoins, setInsufficientCoins] = useState(false);
  const [input, setInput] = useState("");

  const [messagesFinance, setMessagesFinance] = useState<ChatMessage[]>([]);
  const [messagesAnalyze, setMessagesAnalyze] = useState<ChatMessage[]>([]);
  const [historyFinance, setHistoryFinance] = useState<ChatHistoryItem[]>([]);
  const [historyAnalyze, setHistoryAnalyze] = useState<ChatHistoryItem[]>([]);
  const [activeFinanceId, setActiveFinanceId] = useState<string | null>(null);
  const [activeAnalyzeId, setActiveAnalyzeId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const [typing, setTyping] = useState(false);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const ui = useMemo(
    () =>
      language === "ru"
        ? {
            backHome: "На главную",
            financeTutor: "Финансовый наставник",
            riskAssessment: "Оценка риска",
            newChat: "Новый чат",
            chatHistory: "История чатов",
            financeWelcome:
              "Добро пожаловать в Finance Tutor. Задайте вопрос по концепции, формуле или кейсу — отвечу на вашем языке обучения.",
            riskWelcome:
              "Добро пожаловать в Risk Assessment. Опишите сделку или сценарий — я проведу вас по структурированным вопросам.",
            financeDesc: "Задавайте любые финансовые вопросы — объясню простым языком.",
            analyzeDesc: "Опишите сделку или ситуацию, и я оценю риски.",
            send: "Отправить",
            sendAria: "Отправить сообщение",
            financePlaceholder: t.turboAIPage.placeholder,
            analyzePlaceholder: "Опишите сценарий для оценки риска...",
            fallback: "Не удалось сгенерировать ответ. Попробуйте еще раз.",
            connectionIssue: "Проблема соединения. Повторите попытку через минуту.",
            riskScore: "Риск",
            verdict: "Вердикт",
            suggestions: "Попробуйте спросить:",
          }
        : language === "uz"
          ? {
              backHome: "Bosh sahifaga",
              financeTutor: "Moliya ustozi",
              riskAssessment: "Risk baholash",
              newChat: "Yangi chat",
              chatHistory: "Chat tarixi",
              financeWelcome:
                "Finance Tutor'ga xush kelibsiz. Istalgan tushuncha, formula yoki holatni so'rang — o'qish tilingizda javob beraman.",
              riskWelcome:
                "Risk Assessment'ga xush kelibsiz. Bitim yoki holatni tasvirlang — men sizni tuzilgan savollar orqali olib boraman.",
              financeDesc: "Moliya haqida istalgan savolni bering.",
              analyzeDesc: "Bitim yoki holatni tasvirlab, risk tahlili oling.",
              send: "Yuborish",
              sendAria: "Xabarni yuborish",
              financePlaceholder: t.turboAIPage.placeholder,
              analyzePlaceholder: "Risk tahlili uchun holatni tasvirlang...",
              fallback: "Javobni yaratib bo'lmadi. Qayta urinib ko'ring.",
              connectionIssue: "Aloqa muammosi. Iltimos, birozdan so'ng qayta urinib ko'ring.",
              riskScore: "Risk",
              verdict: "Xulosa",
              suggestions: "Savol bering:",
            }
          : {
              backHome: "Back Home",
              financeTutor: "Finance Tutor",
              riskAssessment: "Risk Assessment",
              newChat: "New Chat",
              chatHistory: "Chat History",
              financeWelcome:
                "Welcome to Finance Tutor. Ask any concept, formula, or case — I answer in your study language.",
              riskWelcome:
                "Welcome to Risk Assessment. Describe the deal or scenario; I will guide you through structured questions.",
              financeDesc: "Ask anything about finance, investing, or money — explained simply.",
              analyzeDesc: "Describe a deal or scenario and get a structured risk breakdown.",
              send: "Send",
              sendAria: "Send message",
              financePlaceholder: t.turboAIPage.placeholder,
              analyzePlaceholder: "Describe the scenario for risk analysis...",
              fallback: "I could not generate a response. Please try again.",
              connectionIssue: "Connection issue. Please retry in a moment.",
              riskScore: "Risk Score",
              verdict: "Verdict",
              suggestions: "Try asking:",
            },
    [language, t.turboAIPage.placeholder],
  );

  const activeAnalysisType = useMemo(() => "loan", []);
  const messages = mode === "finance" ? messagesFinance : messagesAnalyze;
  const setMessagesForMode = useCallback((m: Mode, next: React.SetStateAction<ChatMessage[]>) => {
    if (m === "finance") setMessagesFinance(next);
    else setMessagesAnalyze(next);
  }, []);

  useEffect(() => {
    try {
      let rawF = localStorage.getItem(STORAGE.finance);
      let rawA = localStorage.getItem(STORAGE.analyze);
      if (!rawF && !rawA) {
        const legacy = localStorage.getItem(LEGACY_HISTORY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy) as Array<ChatHistoryItem & { mode?: Mode }>;
          if (Array.isArray(parsed)) {
            const f = parsed.filter((h) => h.mode !== "analyze");
            const a = parsed.filter((h) => h.mode === "analyze");
            if (f.length) rawF = JSON.stringify(f.map(({ mode: _, ...rest }) => rest));
            if (a.length) rawA = JSON.stringify(a.map(({ mode: _, ...rest }) => rest));
          }
        }
      }
      const parsedF = rawF ? (JSON.parse(rawF) as ChatHistoryItem[]) : [];
      const parsedA = rawA ? (JSON.parse(rawA) as ChatHistoryItem[]) : [];
      setHistoryFinance(parsedF);
      setHistoryAnalyze(parsedA);
      if (parsedF[0]) { setActiveFinanceId(parsedF[0].id); setMessagesFinance(parsedF[0].messages); }
      else setMessagesFinance([{ id: createId(), role: "assistant", content: ui.financeWelcome }]);
      if (parsedA[0]) { setActiveAnalyzeId(parsedA[0].id); setMessagesAnalyze(parsedA[0].messages); }
      else setMessagesAnalyze([{ id: createId(), role: "assistant", content: ui.riskWelcome }]);
    } catch {
      setMessagesFinance([{ id: createId(), role: "assistant", content: ui.financeWelcome }]);
      setMessagesAnalyze([{ id: createId(), role: "assistant", content: ui.riskWelcome }]);
    } finally { setStorageReady(true); }
  }, [ui.financeWelcome, ui.riskWelcome]);

  useEffect(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;
    if (q === "analyze") { setMode("analyze"); setInput(""); }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(STORAGE.finance, JSON.stringify(historyFinance)); } catch { /* quota */ }
  }, [historyFinance, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try { localStorage.setItem(STORAGE.analyze, JSON.stringify(historyAnalyze)); } catch { /* quota */ }
  }, [historyAnalyze, storageReady]);

  const persistThread = (m: Mode, nextMessages: ChatMessage[]) => {
    const title = nextMessages.find((x) => x.role === "user")?.content.slice(0, 40) || (m === "finance" ? "Finance Tutor" : "Risk Assessment");
    if (m === "finance") {
      const id = activeFinanceId ?? createId();
      setActiveFinanceId(id);
      setHistoryFinance((prev) => {
        const next: ChatHistoryItem = { id, title, messages: nextMessages, updatedAt: new Date().toISOString() };
        return [next, ...prev.filter((h) => h.id !== id)].slice(0, 20);
      });
    } else {
      const id = activeAnalyzeId ?? createId();
      setActiveAnalyzeId(id);
      setHistoryAnalyze((prev) => {
        const next: ChatHistoryItem = { id, title, messages: nextMessages, updatedAt: new Date().toISOString() };
        return [next, ...prev.filter((h) => h.id !== id)].slice(0, 20);
      });
    }
  };

  const switchMode = (m: Mode) => { setMode(m); setInput(""); setTyping(false); };
  const startNewChat = () => {
    const fresh = [{ id: createId(), role: "assistant" as const, content: mode === "finance" ? ui.financeWelcome : ui.riskWelcome }];
    if (mode === "finance") { setMessagesFinance(fresh); setActiveFinanceId(null); }
    else { setMessagesAnalyze(fresh); setActiveAnalyzeId(null); }
    setInput("");
  };

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || typing) return;

    if (!spendCoins(AI_QUESTION_COST)) {
      setInsufficientCoins(true);
      setTimeout(() => setInsufficientCoins(false), 3000);
      return;
    }
    setInsufficientCoins(false);

    const isFirstUserMessage = (mode === "finance" ? messagesFinance : messagesAnalyze).every(m => m.role === "assistant");
    if (isFirstUserMessage) recordActivity();

    const userMsg: ChatMessage = { id: createId(), role: "user", content: text };
    const prev = mode === "finance" ? messagesFinance : messagesAnalyze;
    const nextMessages = [...prev, userMsg];
    const assistantPlaceholder: ChatMessage = { id: createId(), role: "assistant", content: "" };
    setMessagesForMode(mode, [...nextMessages, assistantPlaceholder]);
    setActiveStreamingId(assistantPlaceholder.id);
    setInput("");
    setTyping(true);

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const scrollToBottom = () => { const el = listRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); };
    let currentText = "";
    const appendAssistantChar = (char: string) => {
      currentText += char;
      setMessagesForMode(mode, (ps) => ps.map((m) => m.id === assistantPlaceholder.id ? { ...m, content: `${m.content}${char}` } : m));
      scrollToBottom();
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })), mode, analysisType: mode === "analyze" ? activeAnalysisType : undefined, userId: user?.id ?? null, language, stream: mode === "finance" }),
      });
      if (mode === "finance" && res.ok && res.body) {
        await wait(300 + Math.floor(Math.random() * 401));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          for (const ch of Array.from(chunk)) { appendAssistantChar(ch); await wait(20 + Math.floor(Math.random() * 21)); }
        }
        let finalText = currentText.trim();
        if (!finalText) { finalText = ui.fallback; setMessagesForMode(mode, (ps) => ps.map((m) => m.id === assistantPlaceholder.id ? { ...m, content: finalText } : m)); }
        const doneMessages = [...nextMessages, { ...assistantPlaceholder, content: finalText }];
        setMessagesForMode(mode, doneMessages);
        persistThread(mode, doneMessages);
      } else {
        const data = await res.json().catch(() => ({}));
        const assistantText = mode === "analyze" && typeof data?.risk === "number" ? `${ui.riskScore}: ${Math.round(data.risk)}%\n${ui.verdict}: ${data.verdict}` : data?.text || ui.fallback;
        const done = [...nextMessages, { ...assistantPlaceholder, content: assistantText }];
        setMessagesForMode(mode, done);
        persistThread(mode, done);
      }
    } catch {
      const done = [...nextMessages, { ...assistantPlaceholder, content: ui.connectionIssue }];
      setMessagesForMode(mode, done);
      persistThread(mode, done);
    } finally { setTyping(false); setActiveStreamingId(null); }
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const visibleHistory = mode === "finance" ? historyFinance : historyAnalyze;
  const activeHistoryId = mode === "finance" ? activeFinanceId : activeAnalyzeId;
  const setActiveHistory = (m: Mode, id: string | null, thread: ChatMessage[]) => {
    if (m === "finance") { setActiveFinanceId(id); setMessagesFinance(thread); }
    else { setActiveAnalyzeId(id); setMessagesAnalyze(thread); }
  };

  const isWelcomeOnly = messages.length === 1 && messages[0].role === "assistant";
  const prompts = mode === "finance" ? FINANCE_PROMPTS : ANALYZE_PROMPTS;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navigation />
      <section className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-12">

          {/* Sidebar */}
          <aside className="order-2 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 lg:order-1 lg:col-span-3">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]">
              <ArrowLeft className="h-4 w-4" />
              {ui.backHome}
            </Link>

            {/* Mode tabs */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => switchMode("finance")}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                  mode === "finance"
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === "finance" ? "bg-blue-100 dark:bg-blue-500/20" : "bg-[var(--bg-tertiary)]"}`}>
                  <Sparkles className={`h-4 w-4 ${mode === "finance" ? "text-blue-500" : "text-[var(--text-muted)]"}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate">{ui.financeTutor}</p>
                  <p className="mt-0.5 truncate text-[11px] font-normal text-[var(--text-muted)]">{ui.financeDesc}</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => switchMode("analyze")}
                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
                  mode === "analyze"
                    ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-purple-500/15 dark:text-purple-200 dark:ring-purple-500/30"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${mode === "analyze" ? "bg-violet-100 dark:bg-purple-500/20" : "bg-[var(--bg-tertiary)]"}`}>
                  <ShieldAlert className={`h-4 w-4 ${mode === "analyze" ? "text-violet-500" : "text-[var(--text-muted)]"}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate">{ui.riskAssessment}</p>
                  <p className="mt-0.5 truncate text-[11px] font-normal text-[var(--text-muted)]">{ui.analyzeDesc}</p>
                </div>
              </button>
            </div>

            {/* New Chat */}
            <button
              type="button"
              onClick={startNewChat}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--accent-bg)] hover:text-[var(--accent)]"
            >
              <PlusCircle className="h-4 w-4" />
              {ui.newChat}
            </button>

            {/* Chat history */}
            {visibleHistory.length > 0 && (
              <div>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{ui.chatHistory}</p>
                <div className="max-h-[min(40vh,280px)] space-y-1.5 overflow-y-auto sm:max-h-[400px]">
                  {visibleHistory.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setActiveHistory(mode, h.id, h.messages); setInput(""); }}
                      className={`min-h-10 w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        activeHistoryId === h.id
                          ? mode === "finance"
                            ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                            : "border-violet-200 bg-violet-50 text-violet-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200"
                          : "border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                      }`}
                    >
                      <p className="truncate font-semibold">{h.title}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{new Date(h.updatedAt).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Powered by */}
            <div className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-[var(--bg-tertiary)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
              <Bot className="h-3 w-3" />
              Powered by Claude AI
            </div>
          </aside>

          {/* Chat area */}
          <div className="order-1 flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] lg:order-2 lg:col-span-9" style={{ minHeight: 'calc(100vh - 8rem)', maxHeight: 'calc(100vh - 6rem)' }}>
            {/* Chat header */}
            <div className={`flex items-center gap-3 border-b border-[var(--border)] px-5 py-4 ${mode === "finance" ? "bg-blue-50/50 dark:bg-blue-500/5" : "bg-violet-50/50 dark:bg-purple-500/5"}`}>
              <Image
                src={theme === "dark" ? "/zinvest-icon-only.svg" : "/zinvest-logo-on-light.svg"}
                alt="Zinvest"
                width={32}
                height={32}
                className="h-8 w-8 shrink-0"
              />
              <div>
                <h1 className="text-base font-semibold text-[var(--text-primary)]">
                  {mode === "finance" ? ui.financeTutor : ui.riskAssessment}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {mode === "finance" ? ui.financeDesc : ui.analyzeDesc}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  <Zap className="h-3 w-3" />
                  {coins}
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 rounded-full border border-orange-200/60 bg-orange-50/80 px-2.5 py-1 text-[11px] font-semibold text-orange-600 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-300">
                    <Flame className="h-3 w-3" />
                    {streak}
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto overscroll-y-contain scroll-smooth p-4 sm:p-6 [scrollbar-gutter:stable]"
              style={{ background: 'var(--bg-primary)' }}
            >
              {/* Zinvest welcome card — shown only when chat is empty */}
              {isWelcomeOnly && (
                <div className="mb-6 flex flex-col items-center gap-3 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-blue-50/60 to-violet-50/40 p-6 text-center dark:from-blue-500/5 dark:to-violet-500/5">
                  <Image
                    src={theme === "dark" ? "/zinvest-icon-only.svg" : "/zinvest-logo-on-light.svg"}
                    alt="Zinvest"
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                  <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {language === "ru" ? "Привет, я Zinvest!" : language === "uz" ? "Salom, men Zinvest!" : "Hey, I'm Zinvest!"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-tertiary)]">
                      {mode === "finance"
                        ? (language === "ru" ? "Задайте любой вопрос о финансах — отвечу понятно и по делу." : language === "uz" ? "Moliya haqida istalgan savolni bering." : "Ask me anything about finance — I'll explain it clearly.")
                        : (language === "ru" ? "Опишите сценарий — оценю риски структурированно." : language === "uz" ? "Holatni tasvirlang — riskni tuzilgan holda baholayman." : "Describe any scenario — I'll give you a structured risk breakdown.")
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <Image src="/icon-192.png" alt="" width={12} height={12} className="rounded" />
                    {AI_QUESTION_COST} Zinverts per question · {coins} available
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-4 flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    m.role === "user"
                      ? "bg-blue-500 text-white"
                      : mode === "finance"
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300"
                  }`}>
                    {m.role === "user"
                      ? (user?.name?.[0]?.toUpperCase() ?? <User className="h-4 w-4" />)
                      : (mode === "finance" ? <Sparkles className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />)
                    }
                  </div>

                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-blue-600 text-white"
                      : "rounded-tl-sm border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  }`}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-slate max-w-none break-words text-sm dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-1 prose-headings:text-[var(--text-primary)]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        {typing && m.id === activeStreamingId && (
                          <span className="ml-0.5 inline-flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <span
                                key={i}
                                className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]"
                                style={{ animation: `bounce 1s infinite ${i * 0.15}s` }}
                              />
                            ))}
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {typing && !activeStreamingId && (
                <div className="mb-4 flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${mode === "finance" ? "bg-blue-100 dark:bg-blue-500/20" : "bg-violet-100 dark:bg-violet-500/20"}`}>
                    {mode === "finance" ? <Sparkles className="h-4 w-4 text-blue-500" /> : <ShieldAlert className="h-4 w-4 text-violet-500" />}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-2 w-2 rounded-full bg-[var(--text-muted)]" style={{ animation: `bounce 1s infinite ${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Suggested prompts — shown only on empty chat */}
            {isWelcomeOnly && (
              <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 sm:px-6">
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{ui.suggestions}</p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => void send(p.text)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.02] ${
                        mode === "finance"
                          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/8 dark:text-blue-300 dark:hover:bg-blue-500/15"
                          : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/8 dark:text-violet-300 dark:hover:bg-violet-500/15"
                      }`}
                    >
                      {p.icon}
                      {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input area */}
            <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-stretch gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
                  disabled={typing}
                  placeholder={mode === "finance" ? ui.financePlaceholder : ui.analyzePlaceholder}
                  className="min-h-11 w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={typing || !input.trim()}
                  className={`flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                    mode === "finance" ? "bg-blue-500 hover:bg-blue-600" : "bg-violet-500 hover:bg-violet-600"
                  }`}
                  aria-label={ui.sendAria}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {insufficientCoins ? (
                <p className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
                  Not enough Zinverts — you need {AI_QUESTION_COST} but have {coins}. Keep a streak to earn more!
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                  <Image src="/icon-192.png" alt="" width={10} height={10} className="mr-0.5 inline rounded" />{AI_QUESTION_COST} Zinverts per question · {coins} available · AI can make mistakes
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </main>
  );
}
