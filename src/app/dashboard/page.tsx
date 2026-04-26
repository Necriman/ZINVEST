"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
  import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield, Sparkles, Trophy, User, Timer, X, BarChart3, Target } from "lucide-react";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { UNIT_META, type UnitKey } from "@/lib/unit-test-content";
import {
  completedUnitsCount,
  quizzesCompletedCount,
  bestQuizScoreAcrossUnits,
  overallLessonProgress,
} from "@/lib/learning-progress";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { useLanguage, type AppTranslations } from "@/lib/language-context";
import RiskResultCard, { type RiskResult } from "@/components/RiskResult";

function formatRelativeTime(
  msLeft: number,
  labels: { hoursLeft: string; daysLeft: string },
) {
  const ms = Math.max(0, msLeft);
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  if (totalHours <= 24) return labels.hoursLeft.replace("{n}", String(totalHours));
  const totalDays = Math.ceil(totalHours / 24);
  return labels.daysLeft.replace("{n}", String(totalDays));
}

function unitSidebarLabel(key: UnitKey, t: { unitMeta: Record<string, string> }) {
  switch (key) {
    case "finance-fundamentals":
      return t.unitMeta.financeFundamentals;
    case "investing-basics":
      return t.unitMeta.investingBasics;
    case "financial-analysis":
      return t.unitMeta.financialAnalysis;
    case "personal-finance":
      return t.unitMeta.personalFinance;
    default:
      return "";
  }
}

function unitTrackTitle(key: UnitKey, t: AppTranslations) {
  switch (key) {
    case "finance-fundamentals":
      return t.tracks.financeFundamentals;
    case "investing-basics":
      return t.tracks.investingBasics;
    case "financial-analysis":
      return t.tracks.financialAnalysis;
    case "personal-finance":
      return t.tracks.personalFinance;
    default:
      return "";
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabase();
  const { language, t } = useLanguage();
  const d = t.dashboard;

  const defaultUnit = UNIT_META[0]?.key ?? "finance-fundamentals";
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>(defaultUnit);

  const [top3, setTop3] = useState<
    Array<{
      rank: number;
      userId: string;
      userName: string;
      qualityScore: number;
      durationMs: number;
      finishedAt: string;
      attemptId: string;
    }>
  >([]);

  const [yourBest, setYourBest] = useState<{
    attemptId: string;
    qualityScore: number;
    durationMs: number;
    finishedAt: string;
  } | null>(null);

  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [top3Loading, setTop3Loading] = useState(false);
  const [yourBestLoading, setYourBestLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);

  const [riskAnalyses, setRiskAnalyses] = useState<
    Array<{
      id: string;
      type: string;
      input_data: any;
      result: any;
      created_at: string;
    }>
  >([]);
  const [selectedRiskAnalysisId, setSelectedRiskAnalysisId] = useState<string | null>(null);

  const [aiChatConversations, setAiChatConversations] = useState<
    Array<{
      id: string;
      title: string | null;
      course_key: string | null;
      lesson_id: number | null;
      mode: string | null;
      last_message: string | null;
      updated_at: string | null;
      created_at: string | null;
    }>
  >([]);
  /** After turbo-ai survey redirect (?risk=latest), show result centered until dismissed. */
  const [riskSurveyReveal, setRiskSurveyReveal] = useState(false);

  const lessonUnitBlocks = useMemo(() => {
    const lessonIdsByUnit: Record<UnitKey, number[]> = {
      "finance-fundamentals": [1, 2],
      "investing-basics": [1, 2],
      "financial-analysis": [1, 2],
      "personal-finance": [1, 2],
    };
    return UNIT_META.map((m) => ({ key: m.key, lessonIds: lessonIdsByUnit[m.key] }));
  }, []);
  const unitKeys = useMemo(() => UNIT_META.map((m) => m.key), []);
  const [learningSnapshot, setLearningSnapshot] = useState({
    overallPct: 0,
    unitsDone: 0,
    quizzesDone: 0,
    bestQuiz: 0,
  });

  useEffect(() => {
    const refresh = () => {
      setLearningSnapshot({
        overallPct: overallLessonProgress(lessonUnitBlocks.map((u) => ({ key: u.key, lessonIds: [...u.lessonIds] }))),
        unitsDone: completedUnitsCount(lessonUnitBlocks.map((u) => ({ key: u.key, lessonIds: [...u.lessonIds] }))),
        quizzesDone: quizzesCompletedCount(unitKeys),
        bestQuiz: bestQuizScoreAcrossUnits(unitKeys),
      });
    };
    refresh();
    window.addEventListener("zinvest-progress", refresh);
    const onVis = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("zinvest-progress", refresh);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lessonUnitBlocks, unitKeys]);

  const premiumActive = useMemo(() => {
    if (!premiumExpiresAt) return false;
    return new Date(premiumExpiresAt).getTime() > Date.now();
  }, [premiumExpiresAt]);

  useEffect(() => {
    if (!supabase || !user) return;

    const fetchPremium = async () => {
      setPremiumLoading(true);
      const { data } = await supabase
        .from("premium_rewards")
        .select("expires_at,rank,unit_key")
        .eq("user_id", user.id)
        .order("expires_at", { ascending: false })
        .limit(10);

      const valid = (data ?? [])
        .map((r: any) => r.expires_at as string)
        .filter(Boolean)
        .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());

      setPremiumExpiresAt(valid[0] ?? null);
      setPremiumLoading(false);
    };

    const fetchYourBest = async () => {
      setYourBestLoading(true);
      const { data } = await supabase
        .from("unit_test_attempts")
        .select("id,quality_score,duration_ms,finished_at")
        .eq("user_id", user.id)
        .eq("unit_key", selectedUnit)
        .order("quality_score", { ascending: false })
        .order("duration_ms", { ascending: true })
        .limit(1);

      const best = (data ?? [])[0] as any;
      if (!best) {
        setYourBest(null);
        setYourBestLoading(false);
        return;
      }
      setYourBest({
        attemptId: best.id,
        qualityScore: Number(best.quality_score ?? 0),
        durationMs: Number(best.duration_ms ?? 0),
        finishedAt: best.finished_at,
      });
      setYourBestLoading(false);
    };

    const fetchTop3 = async () => {
      setTop3Loading(true);
      const res = await fetch(`/api/unit-tests/leaderboard?unitKey=${encodeURIComponent(selectedUnit)}`);
      const data = await res.json();
      if (res.ok) setTop3(data.leaderboard ?? []);
      setTop3Loading(false);
    };

    fetchPremium();
    fetchYourBest();
    fetchTop3();
  }, [supabase, user, selectedUnit]);

  useEffect(() => {
    if (!supabase || !user) return;
    const fetchRiskAnalyses = async () => {
      setRiskLoading(true);
      const { data } = await supabase
        .from("analyses")
        .select("id,type,input_data,result,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setRiskAnalyses((data ?? []) as any);
      setRiskLoading(false);
    };
    fetchRiskAnalyses();
  }, [supabase, user]);

  useEffect(() => {
    const localFallback = () => {
      try {
        const entries = [
          ...JSON.parse(localStorage.getItem("zinvest-ai-history-finance") ?? "[]"),
          ...JSON.parse(localStorage.getItem("zinvest-ai-history-analyze") ?? "[]"),
        ] as Array<{ id: string; title: string; messages: Array<{ role: string; content: string }>; updatedAt: string }>;
        const mapped = entries
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10)
          .map((h) => ({
            id: h.id,
            title: h.title,
            course_key: null,
            lesson_id: null,
            mode: "local",
            last_message: h.messages?.[h.messages.length - 1]?.content ?? "",
            updated_at: h.updatedAt,
            created_at: h.updatedAt,
          }));
        if (mapped.length) setAiChatConversations(mapped as any);
      } catch {
        // ignore local parse errors
      }
    };

    if (!supabase || !user) {
      localFallback();
      return;
    }
    const fetchChatHistory = async () => {
      setChatHistoryLoading(true);
      try {
        const { data } = await supabase
          .from("ai_chat_conversations")
          .select(
            "id,title,course_key,lesson_id,mode,last_message,updated_at,created_at"
          )
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(10);

        setAiChatConversations((data ?? []) as any);
        if (!data || data.length === 0) localFallback();
      } catch (e) {
        console.error("Chat history fetch error:", e);
        localFallback();
      } finally {
        setChatHistoryLoading(false);
      }
    };
    fetchChatHistory();
  }, [supabase, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const risk = params.get("risk");
    if (risk === "latest") {
      setSelectedRiskAnalysisId(null);
      setRiskSurveyReveal(true);
    } else {
      const analysisId = params.get("analysisId");
      if (analysisId) setSelectedRiskAnalysisId(analysisId);
    }
  }, []);

  const selectedRiskAnalysis = useMemo(() => {
    if (!riskAnalyses.length) return null;
    if (selectedRiskAnalysisId) {
      return riskAnalyses.find((a) => a.id === selectedRiskAnalysisId) ?? riskAnalyses[0];
    }
    return riskAnalyses[0];
  }, [riskAnalyses, selectedRiskAnalysisId]);

  const selectedRiskResult: RiskResult | null = useMemo(() => {
    if (!selectedRiskAnalysis) return null;
    const r = selectedRiskAnalysis.result ?? {};
    return {
      risk: Number(r.risk ?? 0),
      verdict: String(r.verdict ?? ""),
      confidence: Number(r.confidence ?? 0),
      reasons: Array.isArray(r.reasons) ? r.reasons : [],
      inputData: selectedRiskAnalysis.input_data,
      language: (r.language as any) ?? language,
    };
  }, [selectedRiskAnalysis]);

  const showRiskSurveyOverlay = riskSurveyReveal && Boolean(selectedRiskResult);

  const dismissRiskSurveyOverlay = useCallback(() => {
    setRiskSurveyReveal(false);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!showRiskSurveyOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showRiskSurveyOverlay]);

  useEffect(() => {
    if (!showRiskSurveyOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissRiskSurveyOverlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showRiskSurveyOverlay, dismissRiskSurveyOverlay]);

  const premiumLeftMs = premiumExpiresAt ? new Date(premiumExpiresAt).getTime() - Date.now() : 0;
  const aiChatHistoryTitle =
    language === "uz"
      ? "Repetitor bilan suhbat tarixi"
      : language === "en"
        ? "Tutor chat history"
        : "История переписок с репетитором";

  const aiChatHistoryEmpty =
    language === "uz"
      ? "Hozircha suhbat tarixi yo'q."
      : language === "en"
        ? "No chat history yet."
        : "Пока нет истории переписок.";

  return (
    <AuthGate>
      <main className="min-h-screen bg-[var(--bg-primary)]">
        <Navigation />

        <section className="relative px-6 pt-24 pb-16">
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="mb-2 text-3xl font-bold text-[var(--text-primary)]">{d.title}</h1>
                <p className="text-sm text-[var(--text-secondary)]">{d.subtitle}</p>
              </motion.div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-[var(--shadow)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--text-muted)]">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Learning progress</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{learningSnapshot.overallPct}%</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Lessons marked complete (this device)</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-[var(--shadow)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--text-muted)]">
                  <Target className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Units completed</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {learningSnapshot.unitsDone}/{UNIT_META.length}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">All lessons done in a unit</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-[var(--shadow)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--text-muted)]">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Quizzes submitted</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{learningSnapshot.quizzesDone}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Unit tests finished (local)</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-[var(--shadow)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[var(--text-muted)]">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Best quiz score</span>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {learningSnapshot.quizzesDone ? `${learningSnapshot.bestQuiz}%` : "—"}
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Highest score across units</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{d.allTopics}</p>
                  </div>

                  <div className="space-y-2">
                    {UNIT_META.map((m) => {
                      const active = selectedUnit === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setSelectedUnit(m.key)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                            active
                              ? "border-blue-200 bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10"
                              : "border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-semibold ${
                                  active ? "text-slate-900 dark:text-white" : "text-[var(--text-primary)]"
                                }`}
                              >
                                {unitTrackTitle(m.key, t)}
                              </p>
                              <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-400">
                                {unitSidebarLabel(m.key, t)}
                              </p>
                            </div>
                            <span
                              className={`mt-0.5 text-[11px] font-semibold ${
                                active ? "text-blue-800 dark:text-blue-300" : "text-slate-500 dark:text-slate-500"
                              }`}
                            >
                              {active ? d.selected : d.test}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    <button
                      onClick={() => router.push(`/learn/${selectedUnit}/test`)}
                      className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                      {d.startUnitTest}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main */}
              <div className="lg:col-span-8 xl:col-span-9">
                <div className="space-y-6">
                  {/* Premium card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Crown className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="text-sm text-slate-600 dark:text-slate-300">{d.premium}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-[var(--text-primary)]">
                              {premiumActive ? d.active : d.inactive}
                            </p>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                premiumActive
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              }`}
                            >
                              {premiumActive ? d.unlocked : d.locked}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {premiumLoading ? (
                          <p className="text-sm text-slate-500">{language === "ru" ? "Загрузка..." : language === "uz" ? "Yuklanmoqda..." : "Loading..."}</p>
                        ) : premiumActive && premiumExpiresAt ? (
                          <>
                            <p className="text-sm font-medium text-[var(--text-primary)]">
                              {d.expires} {new Date(premiumExpiresAt).toLocaleString()}
                            </p>
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">
                              {formatRelativeTime(premiumLeftMs, {
                                hoursLeft: d.hoursLeft,
                                daysLeft: d.daysLeft,
                              })}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-slate-600 dark:text-slate-500">{d.winGlobalTop}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Your best */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{d.yourBestAttempt}</p>
                    </div>

                    {yourBestLoading ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{language === "ru" ? "Загрузка результатов..." : language === "uz" ? "Natijalar yuklanmoqda..." : "Loading results..."}</p>
                    ) : yourBest ? (
                      <div className="flex flex-wrap gap-4">
                        <div className="min-w-[180px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
                          <p className="text-xs text-slate-600 dark:text-slate-500">{d.quality}</p>
                          <p className="text-2xl font-bold text-[var(--text-primary)]">{yourBest.qualityScore}%</p>
                        </div>
                        <div className="min-w-[180px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
                          <p className="text-xs text-slate-600 dark:text-slate-500">{d.time}</p>
                          <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {Math.round(yourBest.durationMs / 1000)}s
                          </p>
                        </div>
                        <div className="min-w-[180px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
                          <p className="text-xs text-slate-600 dark:text-slate-500">{d.finished}</p>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {yourBest.finishedAt ? new Date(yourBest.finishedAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{d.noAttemptsYet}</p>
                    )}
                  </div>

                  {/* Global Top */}
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-500" />
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{d.globalTop}</p>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-500">
                        {unitSidebarLabel(selectedUnit, t)}
                      </p>
                    </div>

                    {top3Loading ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{language === "ru" ? "Загрузка рейтинга..." : language === "uz" ? "Reyting yuklanmoqda..." : "Loading leaderboard..."}</p>
                    ) : top3.length > 0 ? (
                      <div className="space-y-2">
                        {top3.map((row) => {
                          const isMe = row.userId === user?.id;
                          return (
                            <div
                              key={row.userId + row.rank}
                              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                                isMe
                                  ? "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10"
                                  : "border-[var(--border)] bg-[var(--bg-tertiary)] dark:border-white/10 dark:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
                                    row.rank === 1
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/20"
                                      : row.rank === 2
                                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                                  }`}
                                >
                                  {row.rank}
                                </span>

                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{row.userName}</p>
                                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-500">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Timer className="h-3.5 w-3.5" />
                                      {Math.round(row.durationMs / 1000)}s
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Shield className="h-3.5 w-3.5 text-purple-300" />
                                      {row.qualityScore}% {d.qualitySuffix}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-500">
                                  {row.finishedAt ? new Date(row.finishedAt).toLocaleDateString() : ""}
                                </p>
                                {isMe && (
                                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                    <User className="h-3.5 w-3.5" />
                                    {d.you}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">{d.noLeaderboard}</p>
                    )}
                  </div>
                </div>

                {/* Risk scoring */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{d.riskScoring}</p>
                    </div>
                    <button
                      onClick={() => router.push("/ai?mode=analyze")}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                    >
                      {d.newAnalysis}
                    </button>
                  </div>

                  {riskLoading ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === "ru" ? "Загрузка анализов..." : language === "uz" ? "Tahlillar yuklanmoqda..." : "Loading analyses..."}</p>
                  ) : selectedRiskResult ? (
                    <div className="space-y-4">
                      <RiskResultCard result={selectedRiskResult} />

                      {riskAnalyses.length > 1 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {d.recentAttempts}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {riskAnalyses.slice(0, 6).map((a) => {
                              const isActive = a.id === selectedRiskAnalysis?.id;
                              const rr = a.result ?? {};
                              const label = `${Math.round(Number(rr.risk ?? 0))}%`;
                              return (
                                <button
                                  key={a.id}
                                  onClick={() => setSelectedRiskAnalysisId(a.id)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                                    isActive
                                      ? "border-purple-300 bg-violet-100 text-violet-900 dark:border-purple-500/30 dark:bg-purple-500/15 dark:text-purple-200"
                                      : "border-[var(--border)] bg-[var(--bg-tertiary)] text-slate-800 hover:border-slate-300 hover:bg-slate-200/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:bg-white/10"
                                  }`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {d.noRiskAnalyses}
                    </p>
                  )}
                </div>

                {/* AI tutor chat history */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{aiChatHistoryTitle}</p>
                    </div>
                  </div>

                  {chatHistoryLoading ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{language === "ru" ? "Загрузка истории..." : language === "uz" ? "Tarix yuklanmoqda..." : "Loading history..."}</p>
                  ) : aiChatConversations.length > 0 ? (
                    <div className="space-y-3">
                      {aiChatConversations.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4"
                        >
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {c.title ?? "AI chat"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">
                            {(c.course_key ? c.course_key : "Tutor") +
                              (c.lesson_id ? ` · ${c.lesson_id}` : "")}
                          </p>
                          <p className="mt-2 truncate text-xs text-slate-600 dark:text-slate-400">
                            {c.last_message ?? ""}
                          </p>
                          <p className="text-[11px] text-slate-600 mt-2">
                            {c.updated_at ? new Date(c.updated_at).toLocaleString() : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{aiChatHistoryEmpty}</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>

      <AnimatePresence>
        {showRiskSurveyOverlay && selectedRiskResult ? (
          <motion.div
            key="risk-survey-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`${d.riskScoring}: ${selectedRiskResult.verdict}`}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              type="button"
              tabIndex={-1}
              aria-hidden
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={dismissRiskSurveyOverlay}
            />
            <motion.div
              className="relative z-10 flex w-full max-w-lg max-h-[min(92vh,760px)] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.85 }}
            >
              <button
                type="button"
                onClick={dismissRiskSurveyOverlay}
                className="absolute right-3 top-3 z-20 rounded-xl border border-white/15 bg-black/50 p-2 text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                aria-label={d.riskSurveyResultClose}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-11">
                <RiskResultCard result={selectedRiskResult} suppressCardMotion />
              </div>
              <div className="shrink-0 border-t border-white/10 bg-[#0a0f1c] px-4 py-3">
                <button
                  type="button"
                  onClick={dismissRiskSurveyOverlay}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  {d.riskSurveyResultClose}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </AuthGate>
  );
}

