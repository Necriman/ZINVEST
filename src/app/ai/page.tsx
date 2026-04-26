"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Sparkles, ShieldAlert, PlusCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navigation from "@/components/sections/navigation";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";

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

export default function AIPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("finance");
  const [input, setInput] = useState("");

  const [messagesFinance, setMessagesFinance] = useState<ChatMessage[]>([]);
  const [messagesAnalyze, setMessagesAnalyze] = useState<ChatMessage[]>([]);
  const [historyFinance, setHistoryFinance] = useState<ChatHistoryItem[]>([]);
  const [historyAnalyze, setHistoryAnalyze] = useState<ChatHistoryItem[]>([]);
  const [activeFinanceId, setActiveFinanceId] = useState<string | null>(null);
  const [activeAnalyzeId, setActiveAnalyzeId] = useState<string | null>(null);
  /** Avoid writing [] to localStorage on first paint before hydrate (would wipe saved chats). */
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
            send: "Отправить",
            sendAria: "Отправить сообщение",
            financePlaceholder: t.turboAIPage.placeholder,
            analyzePlaceholder: "Опишите сценарий для оценки риска...",
            fallback: "Не удалось сгенерировать ответ. Попробуйте еще раз.",
            connectionIssue: "Проблема соединения. Повторите попытку через минуту.",
            riskScore: "Риск",
            verdict: "Вердикт",
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
              send: "Yuborish",
              sendAria: "Xabarni yuborish",
              financePlaceholder: t.turboAIPage.placeholder,
              analyzePlaceholder: "Risk tahlili uchun holatni tasvirlang...",
              fallback: "Javobni yaratib bo'lmadi. Qayta urinib ko'ring.",
              connectionIssue: "Aloqa muammosi. Iltimos, birozdan so'ng qayta urinib ko'ring.",
              riskScore: "Risk",
              verdict: "Xulosa",
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
              send: "Send",
              sendAria: "Send message",
              financePlaceholder: t.turboAIPage.placeholder,
              analyzePlaceholder: "Describe the scenario for risk analysis...",
              fallback: "I could not generate a response. Please try again.",
              connectionIssue: "Connection issue. Please retry in a moment.",
              riskScore: "Risk Score",
              verdict: "Verdict",
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

      if (parsedF[0]) {
        setActiveFinanceId(parsedF[0].id);
        setMessagesFinance(parsedF[0].messages);
      } else {
        setMessagesFinance([{ id: createId(), role: "assistant", content: ui.financeWelcome }]);
      }
      if (parsedA[0]) {
        setActiveAnalyzeId(parsedA[0].id);
        setMessagesAnalyze(parsedA[0].messages);
      } else {
        setMessagesAnalyze([{ id: createId(), role: "assistant", content: ui.riskWelcome }]);
      }
    } catch {
      setMessagesFinance([{ id: createId(), role: "assistant", content: ui.financeWelcome }]);
      setMessagesAnalyze([{ id: createId(), role: "assistant", content: ui.riskWelcome }]);
    } finally {
      setStorageReady(true);
    }
  }, [ui.financeWelcome, ui.riskWelcome]);

  useEffect(() => {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("mode") : null;
    if (q === "analyze") {
      setMode("analyze");
      setInput("");
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE.finance, JSON.stringify(historyFinance));
    } catch {
      /* quota / private mode */
    }
  }, [historyFinance, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      localStorage.setItem(STORAGE.analyze, JSON.stringify(historyAnalyze));
    } catch {
      /* quota / private mode */
    }
  }, [historyAnalyze, storageReady]);

  const persistThread = (m: Mode, nextMessages: ChatMessage[]) => {
    const title =
      nextMessages.find((x) => x.role === "user")?.content.slice(0, 40) ||
      (m === "finance" ? "Finance Tutor" : "Risk Assessment");
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

  const switchMode = (m: Mode) => {
    setMode(m);
    setInput("");
    setTyping(false);
  };

  const startNewChat = () => {
    const fresh = [
      {
        id: createId(),
        role: "assistant" as const,
        content: mode === "finance" ? ui.financeWelcome : ui.riskWelcome,
      },
    ];
    if (mode === "finance") {
      setMessagesFinance(fresh);
      setActiveFinanceId(null);
    } else {
      setMessagesAnalyze(fresh);
      setActiveAnalyzeId(null);
    }
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: ChatMessage = { id: createId(), role: "user", content: text };
    const prev = mode === "finance" ? messagesFinance : messagesAnalyze;
    const nextMessages = [...prev, userMsg];
    const assistantPlaceholder: ChatMessage = { id: createId(), role: "assistant", content: "" };
    const pendingMessages = [...nextMessages, assistantPlaceholder];
    setMessagesForMode(mode, pendingMessages);
    setActiveStreamingId(assistantPlaceholder.id);
    setInput("");
    setTyping(true);

    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const scrollToBottom = () => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };
    let currentText = "";
    const appendAssistantChar = (char: string) => {
      currentText += char;
      setMessagesForMode(mode, (prevState) =>
        prevState.map((m) =>
          m.id === assistantPlaceholder.id ? { ...m, content: `${m.content}${char}` } : m,
        ),
      );
      scrollToBottom();
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          mode,
          analysisType: mode === "analyze" ? activeAnalysisType : undefined,
          userId: user?.id ?? null,
          language,
          stream: mode === "finance",
        }),
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
          for (const ch of Array.from(chunk)) {
            appendAssistantChar(ch);
            await wait(20 + Math.floor(Math.random() * 21));
          }
        }
        let finalText = currentText.trim();
        if (!finalText) {
          finalText = ui.fallback;
          setMessagesForMode(mode, (prevState) =>
            prevState.map((m) =>
              m.id === assistantPlaceholder.id ? { ...m, content: finalText } : m,
            ),
          );
        }
        const doneMessages = [...nextMessages, { ...assistantPlaceholder, content: finalText }];
        setMessagesForMode(mode, doneMessages);
        persistThread(mode, doneMessages);
      } else {
        const data = await res.json().catch(() => ({}));
        const assistantText =
          mode === "analyze" && typeof data?.risk === "number"
            ? `${ui.riskScore}: ${Math.round(data.risk)}%\n${ui.verdict}: ${data.verdict}`
            : data?.text || ui.fallback;
        const done = [...nextMessages, { ...assistantPlaceholder, content: assistantText }];
        setMessagesForMode(mode, done);
        persistThread(mode, done);
      }
    } catch {
      const fallback: ChatMessage = { ...assistantPlaceholder, content: ui.connectionIssue };
      const done = [...nextMessages, fallback];
      setMessagesForMode(mode, done);
      persistThread(mode, done);
    } finally {
      setTyping(false);
      setActiveStreamingId(null);
    }
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const visibleHistory = mode === "finance" ? historyFinance : historyAnalyze;
  const activeHistoryId = mode === "finance" ? activeFinanceId : activeAnalyzeId;
  const setActiveHistory = (m: Mode, id: string | null, thread: ChatMessage[]) => {
    if (m === "finance") {
      setActiveFinanceId(id);
      setMessagesFinance(thread);
    } else {
      setActiveAnalyzeId(id);
      setMessagesAnalyze(thread);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navigation />
      <section className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-12">
          <aside className="order-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 lg:order-1 lg:col-span-3">
            <Link
              href="/"
              className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {ui.backHome}
            </Link>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => switchMode("finance")}
                className={`min-h-11 touch-manipulation rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-200 active:scale-[0.98] sm:text-sm ${
                  mode === "finance"
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {ui.financeTutor}
              </button>
              <button
                type="button"
                onClick={() => switchMode("analyze")}
                className={`min-h-11 touch-manipulation rounded-xl px-4 py-2 text-xs font-semibold transition-colors duration-200 active:scale-[0.98] sm:text-sm ${
                  mode === "analyze"
                    ? "bg-violet-100 text-violet-900 dark:bg-purple-500/20 dark:text-purple-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                }`}
              >
                {ui.riskAssessment}
              </button>
            </div>
            <button
              type="button"
              onClick={startNewChat}
              className="mb-3 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--accent-bg)] active:scale-[0.98] sm:text-sm"
            >
              <PlusCircle className="h-4 w-4 text-blue-400" />
              {ui.newChat}
            </button>
            <p className="mb-2 text-xs text-[var(--text-muted)]">{ui.chatHistory}</p>
            <div className="max-h-[min(40vh,280px)] space-y-2 overflow-y-auto sm:max-h-[480px]">
              {visibleHistory.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => {
                    setActiveHistory(mode, h.id, h.messages);
                    setInput("");
                  }}
                  className={`min-h-11 w-full touch-manipulation rounded-xl border px-3 py-2.5 text-left text-xs transition-colors duration-200 active:scale-[0.99] sm:text-sm ${
                    activeHistoryId === h.id
                      ? mode === "finance"
                        ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100"
                        : "border-violet-200 bg-violet-50 text-violet-900 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-100"
                      : "border-[var(--border)] bg-[var(--bg-tertiary)] text-slate-700 hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  <p className="truncate font-semibold">{h.title}</p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">{new Date(h.updatedAt).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="order-1 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 lg:order-2 lg:col-span-9">
            <div className="mb-4 flex min-w-0 items-center gap-2">
              {mode === "finance" ? <Sparkles className="h-4 w-4 shrink-0 text-blue-500" /> : <ShieldAlert className="h-4 w-4 shrink-0 text-purple-500" />}
              <h1 className="truncate text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                {mode === "finance" ? ui.financeTutor : ui.riskAssessment}
              </h1>
            </div>
            <div
              ref={listRef}
              className="h-[min(50vh,calc(100vh-14rem))] overflow-y-auto overscroll-y-contain scroll-smooth rounded-xl border border-[var(--border)] bg-slate-100 p-3 sm:h-[min(62vh,calc(100vh-11rem))] sm:p-4 [scrollbar-gutter:stable] dark:bg-[#0d1117]"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-2 flex transition-opacity duration-200 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] break-words rounded-xl px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white !text-white [&_*]:!text-white"
                        : "bg-white text-slate-800 shadow-sm dark:bg-white/10 dark:text-slate-200"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-slate max-w-none break-words text-sm dark:prose-invert prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        {typing && m.id === activeStreamingId ? (
                          <span className="ml-0.5 inline-block animate-pulse text-slate-500 dark:text-slate-300">▍</span>
                        ) : null}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-white">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void send();
                  }
                }}
                disabled={typing}
                placeholder={mode === "finance" ? ui.financePlaceholder : ui.analyzePlaceholder}
                className="min-h-11 w-full flex-1 touch-manipulation rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-blue-500/50 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={typing || !input.trim()}
                className="flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
                aria-label={ui.sendAria}
              >
                <Send className="h-4 w-4" />
                <span className="pl-1 text-sm sm:hidden">{ui.send}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
