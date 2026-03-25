"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Shield, Sparkles, Trophy, User, Timer } from "lucide-react";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { UNIT_META, UNIT_TESTS, type UnitKey } from "@/lib/unit-test-content";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";

function formatRelativeTime(msLeft: number) {
  const ms = Math.max(0, msLeft);
  const totalHours = Math.ceil(ms / (1000 * 60 * 60));
  if (totalHours <= 24) return `${totalHours}h left`;
  const totalDays = Math.ceil(totalHours / 24);
  return `${totalDays}d left`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabase();

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

  const premiumActive = useMemo(() => {
    if (!premiumExpiresAt) return false;
    return new Date(premiumExpiresAt).getTime() > Date.now();
  }, [premiumExpiresAt]);

  useEffect(() => {
    if (!supabase || !user) return;

    const fetchPremium = async () => {
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
    };

    const fetchYourBest = async () => {
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
        return;
      }
      setYourBest({
        attemptId: best.id,
        qualityScore: Number(best.quality_score ?? 0),
        durationMs: Number(best.duration_ms ?? 0),
        finishedAt: best.finished_at,
      });
    };

    const fetchTop3 = async () => {
      const res = await fetch(`/api/unit-tests/leaderboard?unitKey=${encodeURIComponent(selectedUnit)}`);
      const data = await res.json();
      if (!res.ok) return;
      setTop3(data.leaderboard ?? []);
    };

    fetchPremium();
    fetchYourBest();
    fetchTop3();
  }, [supabase, user, selectedUnit]);

  const premiumLeftMs = premiumExpiresAt ? new Date(premiumExpiresAt).getTime() - Date.now() : 0;

  return (
    <AuthGate>
      <main className="min-h-screen bg-[#0a0f1c]">
        <Navigation />

        <section className="relative px-6 pt-24 pb-16">
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
                <p className="text-slate-400 text-sm">
                  Take unit tests. Win Global Top and unlock Premium for {`3/2/1 days`} based on rank.
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <p className="text-sm font-semibold text-white">All Topics</p>
                  </div>

                  <div className="space-y-2">
                    {UNIT_META.map((m) => {
                      const active = selectedUnit === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setSelectedUnit(m.key)}
                          className={`w-full text-left rounded-xl border px-3 py-3 transition-colors ${
                            active
                              ? "border-blue-500/30 bg-blue-500/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {UNIT_TESTS[m.key].title.replace(" Unit Test", "")}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 truncate">{m.label}</p>
                            </div>
                            <span
                              className={`mt-0.5 text-[11px] font-semibold ${
                                active ? "text-blue-400" : "text-slate-500"
                              }`}
                            >
                              {active ? "Selected" : "Test"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <button
                      onClick={() => router.push(`/learn/${selectedUnit}/test`)}
                      className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                    >
                      Start Unit Test
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
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Crown className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-sm text-slate-300">Premium</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xl font-bold text-white">{premiumActive ? "Active" : "Inactive"}</p>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                premiumActive
                                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              }`}
                            >
                              {premiumActive ? "Unlocked" : "Locked"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {premiumActive && premiumExpiresAt ? (
                          <>
                            <p className="text-sm text-white font-medium">
                              Expires: {new Date(premiumExpiresAt).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatRelativeTime(premiumLeftMs)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-slate-500">Win Global Top to unlock.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Your best */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <p className="text-sm font-semibold text-white">Your Best Attempt</p>
                    </div>

                    {yourBest ? (
                      <div className="flex flex-wrap gap-4">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-1 min-w-[180px]">
                          <p className="text-xs text-slate-500">Quality</p>
                          <p className="text-2xl font-bold text-white">{yourBest.qualityScore}%</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-1 min-w-[180px]">
                          <p className="text-xs text-slate-500">Time</p>
                          <p className="text-2xl font-bold text-white">
                            {Math.round(yourBest.durationMs / 1000)}s
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex-1 min-w-[180px]">
                          <p className="text-xs text-slate-500">Finished</p>
                          <p className="text-sm text-white font-medium">
                            {yourBest.finishedAt ? new Date(yourBest.finishedAt).toLocaleString() : "—"}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No attempts yet for this unit.</p>
                    )}
                  </div>

                  {/* Global Top */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-purple-400" />
                        <p className="text-sm font-semibold text-white">Global Top (This Unit)</p>
                      </div>
                      <p className="text-xs text-slate-500">{UNIT_META.find((x) => x.key === selectedUnit)?.label}</p>
                    </div>

                    {top3.length > 0 ? (
                      <div className="space-y-2">
                        {top3.map((row) => {
                          const isMe = row.userId === user?.id;
                          return (
                            <div
                              key={row.userId + row.rank}
                              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                                isMe
                                  ? "border-blue-500/30 bg-blue-500/10"
                                  : "border-white/10 bg-white/5"
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
                                  <p className="text-sm font-semibold text-white truncate">{row.userName}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    <span className="inline-flex items-center gap-1.5">
                                      <Timer className="h-3.5 w-3.5" />
                                      {Math.round(row.durationMs / 1000)}s
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                      <Shield className="h-3.5 w-3.5 text-purple-300" />
                                      {row.qualityScore}% quality
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-xs text-slate-500">
                                  {row.finishedAt ? new Date(row.finishedAt).toLocaleDateString() : ""}
                                </p>
                                {isMe && (
                                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[11px] font-semibold text-blue-300">
                                    <User className="h-3.5 w-3.5" />
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No leaderboard yet for this unit.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </AuthGate>
  );
}

