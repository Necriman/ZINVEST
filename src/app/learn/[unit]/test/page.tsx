"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, Shield, CheckCircle2 } from "lucide-react";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { UNIT_TESTS, type UnitKey } from "@/lib/unit-test-content";
import { useAuth } from "@/lib/auth-context";

function formatDurationMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type AnswerMap = Record<string, number>;

export default function UnitTestPage() {
  const router = useRouter();
  const params = useParams<{ unit: string }>();
  const { user } = useAuth();

  const unitKey = (params?.unit ?? "") as UnitKey;
  const unitTest = UNIT_TESTS[unitKey];

  const questions = unitTest?.questions ?? [];
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<{
    yourRank: number | null;
    premiumExpiresAt: string | null;
    qualityScore: number;
    durationMs: number;
  } | null>(null);

  const canSubmit = Object.keys(answers).length === total;

  const qualityScore = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      const chosen = answers[q.id];
      if (typeof chosen === "number" && chosen === q.correctIndex) correct += 1;
    }
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }, [answers, questions, total]);

  const durationMs = Date.now() - startedAt;
  const q = questions[index];

  const onSubmit = async () => {
    if (!unitTest || !user?.id) return;
    if (!canSubmit) return;
    if (submitted || submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/unit-tests/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitKey: unitTest.unitKey,
          userId: user.id,
          qualityScore,
          durationMs,
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
        const msg = data?.error || raw || `Submit failed with status ${res.status}`;
        throw new Error(msg);
      }

      setResult({
        yourRank: data?.yourRank ?? null,
        premiumExpiresAt: data?.premiumExpiresAt ?? null,
        qualityScore,
        durationMs,
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      const err = e as any;
      setErrorMsg(err?.message ?? "Test submit error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <AuthGate>
      <main className="min-h-screen bg-[#0a0f1c]">
        <Navigation />

        <section className="relative px-6 pt-24 pb-16">
          <div className="relative mx-auto max-w-3xl">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex items-start justify-between gap-6 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white">{unitTest?.title ?? "Unit Test"}</h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Answer all questions. Your score is quality (correct %) and ranking uses quality + speed.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <Timer className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-slate-300">{formatDurationMs(durationMs)}</span>
                </div>
              </div>

              {!unitTest ? (
                <div className="text-sm text-slate-300">Unknown unit. Please return to dashboard.</div>
              ) : submitted && result ? (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <p className="text-sm font-medium text-white">Test completed</p>
                      </div>
                      <p className="text-sm text-slate-300">
                        Quality: <span className="text-white font-medium">{result.qualityScore}%</span> · Time:{" "}
                        <span className="text-white font-medium">{formatDurationMs(result.durationMs)}</span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <p className="text-sm font-medium text-white">Premium reward</p>
                      </div>
                      {result.yourRank ? (
                        <>
                          <p className="text-sm text-slate-300">
                            You finished{" "}
                            <span className="text-white font-medium">#{result.yourRank}</span> in this unit’s Global Top.
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Premium expires at: {new Date(result.premiumExpiresAt ?? "").toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-300">You are not in top-3 for this unit right now. Try again!</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={() => router.push(`/learn/${unitTest.unitKey}`)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                      >
                        Back to Unit
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="space-y-5">
                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {errorMsg}
                    </div>
                  )}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>
                      Question {index + 1}/{total}
                    </span>
                    <span>
                      Answered {answeredCount}/{total}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm leading-relaxed text-slate-200 mb-4">{q?.prompt}</p>

                    <div className="space-y-2">
                      {q?.options.map((opt, optIdx) => {
                        const chosen = answers[q.id];
                        const selected = chosen === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                              selected
                                ? "border-blue-500/50 bg-blue-500/10 text-white"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-3">
                      <button
                        disabled={index === 0}
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        disabled={index >= total - 1}
                        onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                      >
                        Next
                      </button>
                    </div>

                    <button
                      onClick={onSubmit}
                      disabled={!canSubmit || submitting}
                      className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Submitting..." : `Submit (Quality: ${qualityScore}%)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </AuthGate>
  );
}

