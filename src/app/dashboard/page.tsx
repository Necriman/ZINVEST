"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Shield, Sparkles, Trophy, User, Timer, X, BarChart3, Target,
  Home, Map, BookOpen, Zap, FileText, Bot, Store, LineChart, CreditCard,
  Settings, LogOut, Flame, Coins, ChevronRight, CalendarCheck, ListChecks,
  TrendingUp, TrendingDown, PenLine, Plus, Trash2, StickyNote, PiggyBank,
  ArrowUpRight, ArrowDownRight, DollarSign,
} from "lucide-react";
import AuthGate from "@/components/auth-gate";
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
import { useZiners } from "@/lib/ziners-context";
import RiskResultCard, { type RiskResult } from "@/components/RiskResult";
import { ZinvestLogo } from "@/components/brand/zinvest-logo";

function formatRelativeTime(msLeft: number, labels: { hoursLeft: string; daysLeft: string }) {
  const ms = Math.max(0, msLeft);
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  if (totalHours <= 24) return labels.hoursLeft.replace("{n}", String(totalHours));
  const totalDays = Math.ceil(totalHours / 24);
  return labels.daysLeft.replace("{n}", String(totalDays));
}

function unitSidebarLabel(key: UnitKey, t: { unitMeta: Record<string, string> }) {
  switch (key) {
    case "finance-fundamentals": return t.unitMeta.financeFundamentals;
    case "investing-basics": return t.unitMeta.investingBasics;
    case "financial-analysis": return t.unitMeta.financialAnalysis;
    case "personal-finance": return t.unitMeta.personalFinance;
    default: return "";
  }
}

function unitTrackTitle(key: UnitKey, t: AppTranslations) {
  switch (key) {
    case "finance-fundamentals": return t.tracks.financeFundamentals;
    case "investing-basics": return t.tracks.investingBasics;
    case "financial-analysis": return t.tracks.financialAnalysis;
    case "personal-finance": return t.tracks.personalFinance;
    default: return "";
  }
}

const UNIT_ICONS = [BarChart3, TrendingUp, Target, CreditCard];
const UNIT_COLORS = [
  { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", num: "text-blue-500", dot: "bg-blue-500" },
  { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", num: "text-emerald-500", dot: "bg-emerald-500" },
  { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", num: "text-rose-500", dot: "bg-rose-500" },
  { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", num: "text-amber-500", dot: "bg-amber-500" },
];

const NAV_SECTIONS = [
  {
    items: [
      { label: "Today", href: "/dashboard", icon: Home, badge: "Route", badgeColor: "blue" },
      { label: "Study plan", href: "/learn", icon: Map, badge: "Soon", badgeColor: "amber" },
    ],
  },
  {
    title: "PRACTICE",
    items: [
      { label: "Units", href: "/learn", icon: BookOpen },
      { label: "Drills", href: "/learn", icon: Zap },
      { label: "Mock tests", href: "/learn", icon: FileText },
    ],
  },
  {
    title: "TOOLS",
    items: [
      { label: "Zinvest AI", href: "/ai", icon: Bot, badge: "Route", badgeColor: "blue" },
      { label: "My startup", href: "/cash-flow", icon: Store },
    ],
  },
  {
    title: "PROGRESS",
    items: [
      { label: "Score map", href: "/dashboard", icon: LineChart },
      { label: "Leaderboard", href: "/dashboard", icon: Trophy },
    ],
  },
];

const BOTTOM_NAV = [
  { label: "Plans", href: "/payment", icon: CreditCard },
  { label: "Profile", href: "/settings", icon: User },
];

function NavItem({
  item,
  active,
}: {
  item: { label: string; href: string; icon: React.ElementType; badge?: string; badgeColor?: string };
  active?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors mb-0.5 ${
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-[var(--text-nav)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
            item.badgeColor === "blue"
              ? "bg-blue-100 text-blue-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ── Notes Panel ──────────────────────────────────────────────────────────────
const NOTES_KEY = "zinvest-my-notes";
type Note = { id: string; text: string; createdAt: string };

function NotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(NOTES_KEY);
      if (stored) setNotes(JSON.parse(stored));
    } catch {}
  }, []);

  const save = (updated: Note[]) => {
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch {}
  };

  const addNote = () => {
    const text = draft.trim();
    if (!text) return;
    save([{ id: Date.now().toString(), text, createdAt: new Date().toISOString() }, ...notes]);
    setDraft("");
  };

  const deleteNote = (id: string) => save(notes.filter((n) => n.id !== id));

  return (
    <div className="p-5 border-b border-[var(--border)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-indigo-500" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            My notes
          </span>
          {notes.length > 0 && (
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
              {notes.length}
            </span>
          )}
        </div>
        <ChevronRight
          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
              placeholder="Add a note..."
              className="flex-1 text-[12px] bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-indigo-400"
            />
            <button
              onClick={addNote}
              className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {notes.length === 0 && (
            <p className="text-[11px] text-[var(--text-muted)]">No notes yet. Add your first one!</p>
          )}
          {notes.map((n) => (
            <div
              key={n.id}
              className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 flex items-start gap-2 group"
            >
              <p className="flex-1 text-[11.5px] text-indigo-900 leading-snug break-words">{n.text}</p>
              <button
                onClick={() => deleteNote(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-300 hover:text-rose-500 flex-shrink-0 mt-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Cash Flow Mini Widget ─────────────────────────────────────────────────────
const CF_KEY = "zinvest-cashflow-entries";
type CfEntry = { id: string; label: string; amount: number; type: "in" | "out"; date: string };

function CashFlowWidget() {
  const [entries, setEntries] = useState<CfEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CF_KEY);
      if (stored) setEntries(JSON.parse(stored));
    } catch {}
  }, []);

  const totalIn = entries.filter((e) => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.type === "out").reduce((s, e) => s + e.amount, 0);
  const net = totalIn - totalOut;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Cash Flow</p>
            <p className="text-[13px] font-bold text-[var(--text-primary)]">My startup</p>
          </div>
        </div>
        <Link
          href="/cash-flow"
          className="text-[11px] text-violet-600 font-semibold flex items-center gap-1 hover:underline"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
            <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">Inflow</p>
          </div>
          <p className="text-[15px] font-bold text-emerald-700">${totalIn.toLocaleString()}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
          <div className="flex items-center gap-1 mb-1">
            <ArrowDownRight className="h-3 w-3 text-rose-600" />
            <p className="text-[9px] uppercase tracking-wider font-bold text-rose-700">Outflow</p>
          </div>
          <p className="text-[15px] font-bold text-rose-700">${totalOut.toLocaleString()}</p>
        </div>
        <div className={`${net >= 0 ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"} border rounded-xl p-3`}>
          <div className="flex items-center gap-1 mb-1">
            {net >= 0
              ? <TrendingUp className="h-3 w-3 text-blue-600" />
              : <TrendingDown className="h-3 w-3 text-amber-600" />
            }
            <p className={`text-[9px] uppercase tracking-wider font-bold ${net >= 0 ? "text-blue-700" : "text-amber-700"}`}>Net</p>
          </div>
          <p className={`text-[15px] font-bold ${net >= 0 ? "text-blue-700" : "text-amber-700"}`}>
            {net >= 0 ? "+" : ""}${net.toLocaleString()}
          </p>
        </div>
      </div>
      {entries.length === 0 && (
        <p className="text-[11px] text-[var(--text-muted)] mt-3 text-center">
          No entries yet —{" "}
          <Link href="/cash-flow" className="text-violet-600 font-semibold hover:underline">
            open Cash Flow
          </Link>{" "}
          to track your startup.
        </p>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabase();
  const { language, t } = useLanguage();
  const d = t.dashboard;
  const { coins, streak, streakHistory } = useZiners();

  const defaultUnit = UNIT_META[0]?.key ?? "finance-fundamentals";
  const [selectedUnit, setSelectedUnit] = useState<UnitKey>(defaultUnit);

  const [top3, setTop3] = useState<Array<{
    rank: number; userId: string; userName: string;
    qualityScore: number; durationMs: number; finishedAt: string; attemptId: string;
  }>>([]);
  const [yourBest, setYourBest] = useState<{
    attemptId: string; qualityScore: number; durationMs: number; finishedAt: string;
  } | null>(null);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);
  const [premiumLoading, setPremiumLoading] = useState(false);
  const [top3Loading, setTop3Loading] = useState(false);
  const [yourBestLoading, setYourBestLoading] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskAnalyses, setRiskAnalyses] = useState<Array<{
    id: string; type: string; input_data: any; result: any; created_at: string;
  }>>([]);
  const [selectedRiskAnalysisId, setSelectedRiskAnalysisId] = useState<string | null>(null);
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
    overallPct: 0, unitsDone: 0, quizzesDone: 0, bestQuiz: 0,
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
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
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
      const { data } = await supabase.from("premium_rewards")
        .select("expires_at").eq("user_id", user.id)
        .order("expires_at", { ascending: false }).limit(10);
      const valid = (data ?? []).map((r: any) => r.expires_at as string).filter(Boolean)
        .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
      setPremiumExpiresAt(valid[0] ?? null);
      setPremiumLoading(false);
    };
    const fetchYourBest = async () => {
      setYourBestLoading(true);
      const { data } = await supabase.from("unit_test_attempts")
        .select("id,quality_score,duration_ms,finished_at").eq("user_id", user.id)
        .eq("unit_key", selectedUnit).order("quality_score", { ascending: false })
        .order("duration_ms", { ascending: true }).limit(1);
      const best = (data ?? [])[0] as any;
      if (!best) { setYourBest(null); setYourBestLoading(false); return; }
      setYourBest({ attemptId: best.id, qualityScore: Number(best.quality_score ?? 0), durationMs: Number(best.duration_ms ?? 0), finishedAt: best.finished_at });
      setYourBestLoading(false);
    };
    const fetchTop3 = async () => {
      setTop3Loading(true);
      const res = await fetch(`/api/unit-tests/leaderboard?unitKey=${encodeURIComponent(selectedUnit)}`);
      const data = await res.json();
      if (res.ok) setTop3(data.leaderboard ?? []);
      setTop3Loading(false);
    };
    fetchPremium(); fetchYourBest(); fetchTop3();
  }, [supabase, user, selectedUnit]);

  useEffect(() => {
    if (!supabase || !user) return;
    const fetchRisk = async () => {
      setRiskLoading(true);
      const { data } = await supabase.from("analyses")
        .select("id,type,input_data,result,created_at").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(10);
      setRiskAnalyses((data ?? []) as any);
      setRiskLoading(false);
    };
    fetchRisk();
  }, [supabase, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const risk = params.get("risk");
    if (risk === "latest") { setSelectedRiskAnalysisId(null); setRiskSurveyReveal(true); }
    else { const id = params.get("analysisId"); if (id) setSelectedRiskAnalysisId(id); }
  }, []);

  const selectedRiskAnalysis = useMemo(() => {
    if (!riskAnalyses.length) return null;
    if (selectedRiskAnalysisId) return riskAnalyses.find((a) => a.id === selectedRiskAnalysisId) ?? riskAnalyses[0];
    return riskAnalyses[0];
  }, [riskAnalyses, selectedRiskAnalysisId]);

  const selectedRiskResult: RiskResult | null = useMemo(() => {
    if (!selectedRiskAnalysis) return null;
    const r = selectedRiskAnalysis.result ?? {};
    return {
      risk: Number(r.risk ?? 0), verdict: String(r.verdict ?? ""),
      confidence: Number(r.confidence ?? 0),
      reasons: Array.isArray(r.reasons) ? r.reasons : [],
      inputData: selectedRiskAnalysis.input_data,
      language: (r.language as any) ?? language,
    };
  }, [selectedRiskAnalysis, language]);

  const showRiskSurveyOverlay = riskSurveyReveal && Boolean(selectedRiskResult);

  const dismissRiskSurveyOverlay = useCallback(() => {
    setRiskSurveyReveal(false);
    router.replace("/dashboard", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (!showRiskSurveyOverlay) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [showRiskSurveyOverlay]);

  useEffect(() => {
    if (!showRiskSurveyOverlay) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); dismissRiskSurveyOverlay(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showRiskSurveyOverlay, dismissRiskSurveyOverlay]);

  const premiumLeftMs = premiumExpiresAt ? new Date(premiumExpiresAt).getTime() - Date.now() : 0;
  const userName = (user as any)?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const userInitial = userName.charAt(0).toUpperCase();
  const loadingText = language === "ru" ? "Загрузка..." : language === "uz" ? "Yuklanmoqda..." : "Loading...";

  // Streak calendar: last 7 days
  const weekDays = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const todayDow = (new Date().getDay() + 6) % 7; // Mon=0
  const weekDates = weekDays.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (todayDow - i));
    return d.toDateString();
  });

  // Today route steps
  const todaySteps = [
    { num: "01", icon: FileText, label: "Full unit test", sub: `${selectedUnit.replace(/-/g, " ")}`, href: `/learn/${selectedUnit}/test`, color: "blue" },
    { num: "02", icon: BookOpen, label: "Study lessons", sub: "Review all units", href: "/learn", color: "green" },
    { num: "03", icon: Zap, label: "Drills", sub: "Target weak areas", href: "/learn", color: "amber" },
    { num: "04", icon: Bot, label: "Ask Zinvest AI", sub: "Financial tutor", href: "/ai", color: "purple" },
  ];

  const stepColors: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 hover:bg-blue-100",
    green: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100",
    amber: "border-amber-200 bg-amber-50 hover:bg-amber-100",
    purple: "border-purple-200 bg-purple-50 hover:bg-purple-100",
  };
  const stepNumColors: Record<string, string> = {
    blue: "text-blue-700", green: "text-emerald-700", amber: "text-amber-700", purple: "text-purple-700",
  };

  return (
    <AuthGate>
      <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-[220px] flex-shrink-0 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col overflow-y-auto">
          {/* Logo */}
          <div className="px-5 py-5">
            <ZinvestLogo textClassName="text-[16px] text-[var(--text-primary)]" />
          </div>

          <div className="mx-4 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold px-3 py-1 rounded-full">
              <PiggyBank className="h-3 w-3" /> Financial literacy
            </span>
          </div>

          {NAV_SECTIONS.map((section, si) => (
            <div key={si} className="px-3 mb-2">
              {section.title && (
                <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-widest px-3 mb-1.5">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavItem key={item.label} item={item} active={item.label === "Today"} />
              ))}
            </div>
          ))}

          <div className="px-3 mb-2">
            {BOTTOM_NAV.map((item) => <NavItem key={item.label} item={item} />)}
          </div>

          {/* Streak bottom banner */}
          <div className="mt-auto mx-3 mb-4">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2.5">
              <Flame className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-orange-800">Keep the streak alive</p>
                <p className="text-[11px] text-orange-600">One route today.</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5 min-h-full">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] text-blue-600 font-bold uppercase tracking-widest mb-1.5">Today route</p>
                <h1 className="text-[26px] font-bold text-[var(--text-primary)] tracking-tight leading-tight">
                  {userName}, here is today&apos;s route.
                </h1>
                <p className="text-[13px] text-[var(--text-muted)] mt-1">
                  Progress: {learningSnapshot.overallPct}% · Goal: complete all units
                </p>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                  <Coins className="h-4 w-4 text-blue-600" />
                  <span className="text-[13px] font-bold text-blue-700">{coins}</span>
                  <span className="text-[11px] text-blue-500 font-medium">Coins</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-[13px] font-bold text-orange-700">{streak}</span>
                  <span className="text-[11px] text-orange-500 font-medium">Streak</span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50", val: `${learningSnapshot.overallPct}%`, lbl: "Learning progress", sub: "Lessons completed" },
                { icon: Target, color: "text-emerald-500", bg: "bg-emerald-50", val: `${learningSnapshot.unitsDone}/${UNIT_META.length}`, lbl: "Units completed", sub: "All lessons in unit" },
                { icon: Shield, color: "text-purple-500", bg: "bg-purple-50", val: String(learningSnapshot.quizzesDone), lbl: "Quizzes done", sub: "Unit tests finished" },
                { icon: Trophy, color: "text-amber-500", bg: "bg-amber-50", val: learningSnapshot.quizzesDone ? `${learningSnapshot.bestQuiz}%` : "—", lbl: "Best score", sub: "Highest across units" },
              ].map(({ icon: Icon, color, bg, val, lbl, sub }) => (
                <div key={lbl} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`h-4.5 w-4.5 ${color}`} />
                  </div>
                  <p className="text-[22px] font-bold text-[var(--text-primary)] leading-none mb-1">{val}</p>
                  <p className="text-[12px] font-semibold text-[var(--text-primary)]">{lbl}</p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Two columns: Today Route + Cash Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Today's Route Steps */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-1">Today route</p>
                    <p className="text-[15px] font-bold text-[var(--text-primary)]">Start your first practice</p>
                  </div>
                  <button
                    onClick={() => router.push(`/learn/${selectedUnit}/test`)}
                    className="text-[11px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    Live focus <Zap className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {todaySteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <Link
                        key={step.num}
                        href={step.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${stepColors[step.color]}`}
                      >
                        <span className={`text-[12px] font-bold min-w-[24px] ${stepNumColors[step.color]}`}>{step.num}</span>
                        <div className={`w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${stepNumColors[step.color]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-semibold ${stepNumColors[step.color]}`}>{step.label}</p>
                          <p className="text-[11px] text-[var(--text-muted)] capitalize">{step.sub}</p>
                        </div>
                        <ChevronRight className={`h-4 w-4 ${stepNumColors[step.color]} opacity-60`} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Cash Flow Widget */}
              <CashFlowWidget />
            </div>

            {/* Unit selector */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">Select unit</p>
                  <p className="text-[15px] font-bold text-[var(--text-primary)]">{d.allTopics}</p>
                </div>
                <button
                  onClick={() => router.push(`/learn/${selectedUnit}/test`)}
                  className="text-[12px] font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {d.startUnitTest} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {UNIT_META.map((m, i) => {
                  const active = selectedUnit === m.key;
                  const c = UNIT_COLORS[i % UNIT_COLORS.length];
                  const UnitIcon = UNIT_ICONS[i % UNIT_ICONS.length];
                  return (
                    <button
                      key={m.key}
                      onClick={() => setSelectedUnit(m.key)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                        active ? c.bg : "bg-[var(--bg-primary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-white/70" : "bg-[var(--bg-secondary)]"}`}>
                        <UnitIcon className={`h-4.5 w-4.5 ${active ? c.num : "text-[var(--text-muted)]"}`} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-bold ${active ? c.num : "text-[var(--text-muted)]"}`}>
                          Unit {String(i + 1).padStart(2, "0")}
                        </p>
                        <p className={`text-[13px] font-semibold truncate ${active ? c.text : "text-[var(--text-primary)]"}`}>
                          {unitTrackTitle(m.key, t)}
                        </p>
                      </div>
                      {active && <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href="/learn"
                  className="flex-1 text-center border border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-medium px-4 py-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  View all units
                </Link>
              </div>
            </div>

            {/* Leaderboard + Your Best — side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leaderboard */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <p className="text-[13px] font-bold text-[var(--text-primary)]">{d.globalTop}</p>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">{unitSidebarLabel(selectedUnit, t)}</p>
                </div>
                {top3Loading ? (
                  <p className="text-[13px] text-[var(--text-muted)]">{loadingText}</p>
                ) : top3.length > 0 ? (
                  <div className="space-y-2">
                    {top3.map((row) => {
                      const isMe = row.userId === user?.id;
                      const rankStyles = [
                        "bg-amber-50 border-amber-200 text-amber-700",
                        "bg-slate-50 border-slate-200 text-slate-600",
                        "bg-orange-50 border-orange-200 text-orange-700",
                      ];
                      return (
                        <div
                          key={row.userId + row.rank}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isMe ? "bg-blue-50 border-blue-200" : "bg-[var(--bg-primary)] border-[var(--border)]"}`}
                        >
                          <span className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-[12px] font-bold border ${rankStyles[(row.rank - 1) % 3]}`}>
                            {row.rank}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-[var(--text-primary)]">{row.userName}</p>
                            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-0.5">
                              <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{Math.round(row.durationMs / 1000)}s</span>
                              <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-purple-400" />{row.qualityScore}%</span>
                            </div>
                          </div>
                          {isMe && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              <User className="h-3 w-3" />{d.you}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[var(--text-muted)]">{d.noLeaderboard}</p>
                )}
              </div>

              {/* Your Best Attempt */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">{d.yourBestAttempt}</p>
                </div>
                {yourBestLoading ? (
                  <p className="text-[13px] text-[var(--text-muted)]">{loadingText}</p>
                ) : yourBest ? (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: d.quality, value: `${yourBest.qualityScore}%`, color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
                      { label: d.time, value: `${Math.round(yourBest.durationMs / 1000)}s`, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
                      { label: d.finished, value: yourBest.finishedAt ? new Date(yourBest.finishedAt).toLocaleDateString() : "—", color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} className={`${bg} border rounded-xl p-3`}>
                        <p className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">{label}</p>
                        <p className={`text-[18px] font-bold ${color} mt-1`}>{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-[var(--text-muted)] mb-3">{d.noAttemptsYet}</p>
                    <button
                      onClick={() => router.push(`/learn/${selectedUnit}/test`)}
                      className="text-[12px] font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
                    >
                      Take your first test
                    </button>
                  </div>
                )}

                {/* Premium status below */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <p className="text-[12px] font-semibold text-[var(--text-primary)]">{d.premium}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      premiumActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border)]"
                    }`}>
                      {premiumActive ? d.unlocked : d.locked}
                    </span>
                  </div>
                  {premiumActive && premiumExpiresAt && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      {d.expires} {new Date(premiumExpiresAt).toLocaleDateString()}
                      {" · "}{formatRelativeTime(premiumLeftMs, { hoursLeft: d.hoursLeft, daysLeft: d.daysLeft })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Risk Scoring */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">AI Analysis</p>
                    <p className="text-[13px] font-bold text-[var(--text-primary)]">{d.riskScoring}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/ai?mode=analyze")}
                  className="text-[12px] font-semibold text-purple-600 border border-purple-200 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  {d.newAnalysis}
                </button>
              </div>
              {riskLoading ? (
                <p className="text-[13px] text-[var(--text-muted)]">{loadingText}</p>
              ) : selectedRiskResult ? (
                <div className="space-y-4">
                  <RiskResultCard result={selectedRiskResult} />
                  {riskAnalyses.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-[var(--text-muted)]">{d.recentAttempts}</p>
                      <div className="flex flex-wrap gap-2">
                        {riskAnalyses.slice(0, 6).map((a) => {
                          const isActive = a.id === selectedRiskAnalysis?.id;
                          const label = `${Math.round(Number((a.result ?? {}).risk ?? 0))}%`;
                          return (
                            <button
                              key={a.id}
                              onClick={() => setSelectedRiskAnalysisId(a.id)}
                              className={`rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                                isActive
                                  ? "border-purple-200 bg-purple-50 text-purple-700"
                                  : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-[var(--text-muted)]">{d.noRiskAnalyses}</p>
              )}
            </div>

          </div>
        </main>

        {/* ── RIGHT PANEL ── */}
        <aside className="w-[280px] flex-shrink-0 bg-[var(--bg-card)] border-l border-[var(--border)] flex flex-col overflow-y-auto">

          {/* Streak + Calendar */}
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <Flame className="h-10 w-10 text-orange-500" />
              </div>
              <div>
                <p className="text-[34px] font-extrabold text-orange-500 leading-none">{streak}</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-medium">Day streak</p>
              </div>
            </div>
            <div className="flex gap-1">
              {weekDays.map((day, i) => {
                const isToday = i === todayDow;
                const hasActivity = streakHistory[weekDates[i]];
                return (
                  <div
                    key={day}
                    className={`flex-1 rounded-full py-1.5 flex flex-col items-center gap-1 text-[8px] font-bold transition-colors ${
                      isToday
                        ? "bg-orange-400 text-white"
                        : hasActivity
                        ? "bg-orange-100 text-orange-700"
                        : "bg-[var(--bg-primary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {day}
                    <div className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : hasActivity ? "bg-orange-400" : "bg-[var(--border)]"}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coins + User */}
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Coins className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-[32px] font-extrabold text-blue-600 leading-none">{coins}</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 font-medium">Coins earned</p>
              </div>
            </div>
            <div className="h-px bg-[var(--border)] mb-4" />
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#1e1e1c] flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{userName}</p>
                <p className="text-[11px] text-[var(--text-muted)]">Weekly progress</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)] font-medium">
                Unranked
              </span>
            </div>
          </div>

          {/* Notes Panel */}
          <NotesPanel />

          {/* Financial goal / countdown */}
          <div className="p-5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Financial goal</p>
                  <p className="text-[13px] font-bold text-[var(--text-primary)]">Set target score</p>
                </div>
              </div>
              <Link href="/onboarding" className="text-[11px] text-blue-600 font-semibold hover:underline">Set goal</Link>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Pick your target to turn this into a real progress tracker.
            </p>
          </div>

          {/* Today's tasks */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Today&apos;s tasks</span>
              <Link href="/learn" className="ml-auto text-[11px] text-blue-600 font-semibold">
                View plan
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { done: learningSnapshot.unitsDone > 0, label: "Complete a unit test" },
                { done: learningSnapshot.overallPct > 0, label: "Study a lesson" },
              ].map((task) => (
                <div key={task.label} className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    task.done ? "bg-emerald-500 border-emerald-500" : "border-[var(--border)]"
                  }`}>
                    {task.done && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <p className={`text-[12px] ${task.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                    {task.label}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/learn" className="block mt-3 text-[11px] text-blue-600 font-semibold hover:underline">
              Make a study plan
            </Link>
          </div>

        </aside>
      </div>

      {/* Risk survey overlay */}
      <AnimatePresence>
        {showRiskSurveyOverlay && selectedRiskResult ? (
          <motion.div
            key="risk-survey-overlay"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              type="button" tabIndex={-1} aria-hidden
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }} onClick={dismissRiskSurveyOverlay}
            />
            <motion.div
              className="relative z-10 flex w-full max-w-lg max-h-[min(92vh,760px)] flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320, mass: 0.85 }}
            >
              <button
                type="button" onClick={dismissRiskSurveyOverlay}
                className="absolute right-3 top-3 z-20 rounded-xl border border-white/15 bg-black/50 p-2 text-slate-200 hover:bg-white/10 transition-colors"
                aria-label={d.riskSurveyResultClose}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-11">
                <RiskResultCard result={selectedRiskResult} suppressCardMotion />
              </div>
              <div className="shrink-0 border-t border-white/10 bg-[#0a0f1c] px-4 py-3">
                <button
                  type="button" onClick={dismissRiskSurveyOverlay}
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-[13px] font-semibold text-white hover:bg-white/15 transition-colors"
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
