"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock3, CheckCircle2, XCircle, Lock } from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useLanguage } from "@/lib/language-context";
import AuthGate from "@/components/auth-gate";
import { UNIT_TESTS, UNIT_META, type UnitKey } from "@/lib/unit-test-content";
import { getLocalizedUnitTest } from "@/lib/unit-tests-i18n";
import { LessonRichText } from "@/components/lesson-rich-text";
import {
  isUnitFullyComplete,
  lessonStorageKey,
  loadProgress,
  recordUnitQuizAttempt,
  setLessonComplete,
} from "@/lib/learning-progress";

export const dynamic = "force-dynamic";

const LESSON_TEMPLATES: Record<UnitKey, Array<{ id: number; title: string; body: string }>> = {
  "finance-fundamentals": [
    {
      id: 1,
      title: "What Is Finance?",
      body: "## Money and value\n\n**Money** is a store of value and medium of exchange. Build cash discipline before chasing returns.",
    },
    {
      id: 2,
      title: "Valuation & Time Value of Money",
      body: "## Valuation\n\nLearn how money changes value over time and how to calculate present value (PV) and future value (FV).",
    },
  ],
  "investing-basics": [
    {
      id: 1,
      title: "Diversification",
      body: "## Diversification\n\nSpread exposure across assets to reduce **concentration risk** in one security or sector.",
    },
    {
      id: 2,
      title: "Compounding",
      body: "## Compounding\n\nReinvest returns to earn **return-on-return** over long horizons.",
    },
  ],
  "financial-analysis": [
    {
      id: 1,
      title: "Reading Statements",
      body: "## Three statements\n\nUse **income statement**, **balance sheet**, and **cash flow** together.",
    },
    {
      id: 2,
      title: "Liquidity Ratios",
      body: "## Liquidity\n\nRatios like the current ratio show ability to cover **near-term obligations**.",
    },
  ],
  "personal-finance": [
    {
      id: 1,
      title: "Emergency Planning",
      body: "## Emergency fund\n\nTarget **3–6 months** of essential expenses in liquid, stable accounts.",
    },
    {
      id: 2,
      title: "Debt Prioritization",
      body: "## Debt Strategy\n\nPrioritize **high-interest** balances while keeping minimum payments elsewhere.",
    },
  ],
};

export default function ModulesPage() {
  const { t, language } = useLanguage();
  const [progressBump, setProgressBump] = useState(0);
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>(UNIT_META[0].key);
  const [activeTab, setActiveTab] = useState<"ai" | "chat" | "risk">("ai");
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizStartAt, setQuizStartAt] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [quizShowSummary, setQuizShowSummary] = useState(false);
  const [finishedTimeSec, setFinishedTimeSec] = useState(0);

  const [unitChats, setUnitChats] = useState<Record<UnitKey, Array<{ role: "user" | "ai"; text: string }>>>({
    "finance-fundamentals": [{ role: "ai", text: "Welcome to Zinvest AI. Ask about budgets, revenue, and profit." }],
    "investing-basics": [{ role: "ai", text: "Ask me about ETFs, risk, diversification, and compounding." }],
    "financial-analysis": [{ role: "ai", text: "I can explain balance sheets, ratios, and cash flow analysis." }],
    "personal-finance": [{ role: "ai", text: "Ask about emergency funds, debt strategy, and credit." }],
  });
  const [chatDraft, setChatDraft] = useState("");

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!quizOpen || quizStartAt == null) return;
    const id = window.setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [quizOpen, quizStartAt]);

  const unitLessons = useMemo(() => {
    void progressBump;
    const p = loadProgress();
    const out: Record<UnitKey, Array<{ id: number; title: string; body: string; completed: boolean }>> = {
      "finance-fundamentals": [],
      "investing-basics": [],
      "financial-analysis": [],
      "personal-finance": [],
    };
    for (const key of Object.keys(LESSON_TEMPLATES) as UnitKey[]) {
      out[key] = LESSON_TEMPLATES[key].map((l) => ({
        ...l,
        completed: Boolean(p.lessons[lessonStorageKey(key, l.id)]),
      }));
    }
    return out;
  }, [progressBump]);

  const unitProgress = useMemo(() => {
    return UNIT_META.map((u) => {
      const lessons = unitLessons[u.key];
      const completed = lessons.filter((l) => l.completed).length;
      const pct = lessons.length ? Math.round((completed / lessons.length) * 100) : 0;
      return { key: u.key, completed, total: lessons.length, pct };
    });
  }, [unitLessons]);

  const overallProgress = useMemo(() => {
    const total = unitProgress.reduce((acc, x) => acc + x.total, 0);
    const done = unitProgress.reduce((acc, x) => acc + x.completed, 0);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [unitProgress]);

  const unitLocked = (idx: number) => {
    if (idx === 0) return false;
    const prev = UNIT_META[idx - 1]?.key;
    if (!prev) return false;
    const prevLessons = LESSON_TEMPLATES[prev].map((l) => l.id);
    return !isUnitFullyComplete(prev, prevLessons);
  };

  const selectedLessons = unitLessons[selectedUnit];
  const [lessonPdfMarkdownByKey, setLessonPdfMarkdownByKey] = useState<Record<string, string>>({});
  const [lessonPdfTitleByKey, setLessonPdfTitleByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const lessons = LESSON_TEMPLATES[selectedUnit] ?? [];
    if (!lessons.length) return;

    const controller = new AbortController();
    void Promise.all(
      lessons.map(async (l) => {
        const key = `${language}:${selectedUnit}:${l.id}`;
        if (lessonPdfMarkdownByKey[key]) return;

        const res = await fetch(
          `/api/lesson-content?lessonId=${encodeURIComponent(l.id)}&language=${encodeURIComponent(language)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { markdown?: string; title?: string | null };
        if (cancelled) return;
        if (typeof data?.title === "string" && data.title.trim()) {
          setLessonPdfTitleByKey((prev) => ({ ...prev, [key]: data.title!.trim() }));
        }
        if (typeof data?.markdown === "string" && data.markdown.trim().length > 0) {
          setLessonPdfMarkdownByKey((prev) => ({ ...prev, [key]: data.markdown! }));
        }
      }),
    ).catch(() => {});

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [language, selectedUnit, lessonPdfMarkdownByKey]);
  const questions = useMemo(
    () => getLocalizedUnitTest(language, selectedUnit)?.questions ?? UNIT_TESTS[selectedUnit].questions,
    [language, selectedUnit],
  );
  const currentQuestion = quizIndex >= 0 && quizIndex < questions.length ? questions[quizIndex] : null;
  const quizElapsed = quizStartAt ? Math.max(0, Math.floor((Date.now() - quizStartAt) / 1000)) : 0;
  const selectedProgress = unitProgress.find((u) => u.key === selectedUnit);

  const quizScorePct = useMemo(() => {
    const correct = questions.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
    return questions.length === 0 ? 0 : Math.round((correct / questions.length) * 100);
  }, [questions, quizAnswers]);

  const bump = () => setProgressBump((b) => b + 1);

  const openQuiz = () => {
    setQuizOpen(true);
    setQuizIndex(0);
    setQuizAnswers({});
    setFeedback(null);
    setQuizShowSummary(false);
    setFinishedTimeSec(0);
    setQuizStartAt(Date.now());
  };

  const closeQuiz = () => {
    setQuizOpen(false);
    setQuizStartAt(null);
    setQuizShowSummary(false);
  };

  const toggleLesson = (unit: UnitKey, lessonId: number, done: boolean) => {
    setLessonComplete(unit, lessonId, done);
    bump();
  };

  const sendAiMessage = () => {
    const trimmed = chatDraft.trim();
    if (!trimmed) return;
    setUnitChats((prev) => ({
      ...prev,
      [selectedUnit]: [
        ...(prev[selectedUnit] || []),
        { role: "user", text: trimmed },
        { role: "ai", text: `Zinvest AI (${selectedUnit}): Focus on the lesson objective and practice one key idea today.` },
      ],
    }));
    setChatDraft("");
  };

  return (
    <AuthGate>
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navigation />

        <section className="relative px-3 pb-8 pt-20 sm:px-4 sm:pt-24">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]"></div>
            <div className="absolute bottom-1/4 -right-32 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[100px]"></div>
          </div>

          <div className="relative w-full">
            {/* Compact header row */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.modulesPage.backToHome}
                </Link>
                <span className="text-[var(--border)]">·</span>
                <h1 className="text-base font-bold text-[var(--text-primary)]">Learning Portal</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <motion.div
                    key={overallProgress}
                    initial={{ width: 0 }}
                    animate={{ width: `${overallProgress}%` }}
                    transition={{ duration: 0.55, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                  />
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{overallProgress}%</span>
              </div>
            </motion.div>

            <div className="grid gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                  <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Units</p>
                  <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                    {UNIT_META.map((unit, idx) => {
                      const active = selectedUnit === unit.key;
                      const stats = unitProgress.find((u) => u.key === unit.key);
                      const locked = unitLocked(idx);
                      return (
                        <button
                          key={unit.key}
                          type="button"
                          disabled={locked}
                          onClick={() => !locked && setSelectedUnit(unit.key)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-all duration-300 ${
                            locked
                              ? "cursor-not-allowed border-slate-200/80 bg-slate-100/60 opacity-45 dark:border-white/5 dark:bg-white/[0.02]"
                              : active
                                ? "border-blue-200 bg-blue-100 dark:border-blue-500/40 dark:bg-blue-500/15"
                                : "border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                active && !locked ? "text-slate-900 dark:text-white" : "text-[var(--text-primary)]"
                              }`}
                            >
                              Unit {idx + 1}
                            </p>
                            {locked ? (
                              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-red-300/90">
                                <Lock className="h-3 w-3" />
                                Locked
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{unit.label}</p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <div className="h-full rounded-full bg-blue-400 transition-[width] duration-500" style={{ width: `${stats?.pct ?? 0}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-9">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Unit Workspace</h2>
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1 text-xs text-slate-600 dark:text-slate-300">
                        {selectedProgress?.completed}/{selectedProgress?.total} completed
                      </span>
                    </div>
                    <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-[#0d1117]">
                      {selectedLessons.map((lesson) => (
                        <article
                          key={lesson.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-blue-700 dark:text-blue-300">Lesson {lesson.id}</p>
                            <button
                              type="button"
                              onClick={() => toggleLesson(selectedUnit, lesson.id, !lesson.completed)}
                              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                                lesson.completed
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200"
                                  : "bg-slate-200 text-slate-800 hover:bg-slate-300/80 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
                              }`}
                            >
                              {lesson.completed ? "Completed" : "Mark complete"}
                            </button>
                          </div>
                          {(() => {
                            const key = `${language}:${selectedUnit}:${lesson.id}`;
                            const title = lessonPdfTitleByKey[key] ?? lesson.title;
                            const source = lessonPdfMarkdownByKey[key] ?? lesson.body;
                            return (
                              <>
                                <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                                <div className="mt-2 text-sm leading-7">
                                  <LessonRichText source={source} />
                                </div>
                              </>
                            );
                          })()}
                          <p className="mt-3 text-xs text-slate-600 dark:text-slate-500">
                            <mark className="rounded bg-blue-100 px-1 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200">
                              Key formula: Profit = Revenue − Costs
                            </mark>
                          </p>
                        </article>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={openQuiz}
                        className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
                      >
                        Take the Quiz
                      </button>
                      <Link
                        href={`/ai?course=${selectedUnit}`}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300 hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                      >
                        Open Full AI Tutor
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {[
                        { id: "ai", label: "Zinvest AI" },
                        { id: "chat", label: "Chat History" },
                        { id: "risk", label: "Risk Assessment" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id as "ai" | "chat" | "risk")}
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-300 ${
                            activeTab === tab.id
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "ai" && (
                      <div className="space-y-3">
                        <div className="h-[340px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-100 p-3 dark:border-white/10 dark:bg-[#0d1117]">
                          {(unitChats[selectedUnit] || []).map((m, idx) => (
                            <div
                              key={idx}
                              className={`mb-2 rounded-xl px-3 py-2 text-sm ${
                                m.role === "ai"
                                  ? "bg-blue-600 text-white shadow-sm dark:bg-blue-600/90 dark:text-white"
                                  : "border border-slate-200 bg-white text-slate-900 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
                              }`}
                            >
                              {m.text}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={chatDraft}
                            onChange={(e) => setChatDraft(e.target.value)}
                            placeholder="Ask Zinvest AI about this unit..."
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-slate-500 focus:border-blue-500/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={sendAiMessage}
                            className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "chat" && (
                      <div className="space-y-2">
                        {(unitChats[selectedUnit] || []).filter((m) => m.role === "user").length > 0 ? (
                          (unitChats[selectedUnit] || [])
                            .filter((m) => m.role === "user")
                            .map((m, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                              >
                                {m.text}
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-slate-600 dark:text-slate-400">No chat history yet for this unit.</p>
                        )}
                      </div>
                    )}

                    {activeTab === "risk" && (
                      <div className="rounded-xl border border-purple-200 bg-violet-50 p-4 dark:border-purple-500/30 dark:bg-purple-500/10">
                        <p className="text-sm font-semibold text-violet-950 dark:text-white">Risk Assessment</p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                          Run a structured risk session in the dedicated AI workspace. Your latest results sync to the dashboard after you finish.
                        </p>
                        <Link
                          href="/ai"
                          className="mt-3 inline-flex rounded-xl border border-purple-400/30 bg-purple-500/20 px-3 py-2 text-xs font-semibold text-purple-100 transition-colors hover:bg-purple-500/30"
                        >
                          Open Risk Assessment
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">Resource Hub</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Interactive lessons and practice — open a track to study in the app.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { title: "Finance fundamentals", href: "/courses/finance-fundamentals" },
                      { title: "Investing basics", href: "/learn/investing-basics" },
                      { title: "AI workspace", href: "/ai" },
                    ].map((r) => (
                      <Link
                        key={r.title}
                        href={r.href}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4 transition-all duration-300 hover:border-blue-300 hover:bg-slate-200/50 dark:hover:border-blue-400/40 dark:hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</p>
                        <span className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white">
                          Open
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />

        {quizOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm dark:bg-black/70">
            <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-[var(--text-primary)] shadow-2xl dark:border-white/10 dark:bg-[#0d1117]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Unit Quiz</h3>
                <div className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <Clock3 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                  {quizShowSummary ? finishedTimeSec : quizElapsed}s
                </div>
              </div>

              {!quizShowSummary && currentQuestion ? (
                <div>
                  <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                    Question {quizIndex + 1}/{questions.length}
                  </p>
                  <p className="mb-4 text-[var(--text-primary)]">{currentQuestion.prompt}</p>
                  <div className="space-y-2">
                    {currentQuestion.options.map((opt, idx) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: idx }))}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors duration-300 ${
                          quizAnswers[currentQuestion.id] === idx
                            ? "border-blue-200 bg-blue-100 text-blue-950 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-white"
                            : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {feedback && (
                    <div
                      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                        feedback.ok ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200" : "border-red-500/30 bg-red-500/15 text-red-200"
                      }`}
                    >
                      <p className="mb-1 font-semibold">{feedback.ok ? "Access Granted" : "Access Denied"}</p>
                      <p>{feedback.text}</p>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!currentQuestion) return;
                        const chosen = quizAnswers[currentQuestion.id];
                        if (typeof chosen !== "number") return;
                        const ok = chosen === currentQuestion.correctIndex;
                        setFeedback({
                          ok,
                          text: ok
                            ? "Correct answer. Access granted."
                            : `Correct answer: ${currentQuestion.options[currentQuestion.correctIndex]}. Review the lesson and try again.`,
                        });
                      }}
                      className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
                    >
                      Submit Answer
                    </button>
                    <button
                      type="button"
                      disabled={!feedback}
                      onClick={() => {
                        if (!feedback) return;
                        setFeedback(null);
                        if (quizIndex >= questions.length - 1) {
                          const tsec = quizStartAt != null ? Math.floor((Date.now() - quizStartAt) / 1000) : 0;
                          setFinishedTimeSec(tsec);
                          setQuizShowSummary(true);
                          const correct = questions.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
                          const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;
                          recordUnitQuizAttempt(selectedUnit, pct, tsec);
                          bump();
                        } else {
                          setQuizIndex((i) => i + 1);
                        }
                      }}
                      className="rounded-xl border border-[var(--border)] bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition-colors duration-300 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      {quizIndex >= questions.length - 1 ? "View results" : "Next"}
                    </button>
                    <button
                      type="button"
                      onClick={closeQuiz}
                      className="ml-auto rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-semibold text-[var(--text-primary)]">Results</p>
                  <div className="rounded-xl border border-[var(--border)] bg-slate-50 p-4 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                    <p>
                      Score: <span className="font-semibold text-[var(--text-primary)]">{quizScorePct}%</span>
                    </p>
                    <p className="mt-1">Time taken: {finishedTimeSec}s</p>
                  </div>
                  <div className="grid max-h-[220px] gap-2 overflow-y-auto pr-1">
                    {questions.map((q) => {
                      const ok = quizAnswers[q.id] === q.correctIndex;
                      return (
                        <div
                          key={q.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                        >
                          <span className="truncate">{q.prompt}</span>
                          {ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : <XCircle className="h-4 w-4 shrink-0 text-red-300" />}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={closeQuiz}
                    className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-600"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
