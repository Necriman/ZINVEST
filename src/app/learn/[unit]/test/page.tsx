"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, Shield, CheckCircle2 } from "lucide-react";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import type { UnitKey } from "@/lib/unit-test-content";
import { getLocalizedUnitTest } from "@/lib/unit-tests-i18n";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";

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
  const { language, t } = useLanguage();
  const ut = t.unitTestPage;

  const unitKey = (params?.unit ?? "") as UnitKey;
  const unitTest = getLocalizedUnitTest(language, unitKey);

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
        const msg = data?.error || raw || `HTTP ${res.status}`;
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
      setErrorMsg(err?.message ?? ut.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = useMemo(() => {
    // Hide "quality so far" spoiler while the user is answering.
    // Example: "Отправить (качество: {n}%)" -> "Отправить"
    return (ut.submitWithQuality ?? "")
      .replace(/\s*[\(（][^)\）]*[\)）]\s*$/g, "")
      .trim();
  }, [ut.submitWithQuality]);

  const answeredCount = Object.keys(answers).length;
  const progress = total > 0 ? Math.round((answeredCount / total) * 100) : 0;

  return (
    <AuthGate>
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navigation />

        <section className="relative px-4 pt-24 pb-16 md:px-6 lg:px-8">
          <div className="relative mx-auto w-full max-w-[1600px]">
            <Link
              href="/dashboard"
              className="mb-4 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              {ut.backToDashboard}
            </Link>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)] md:p-6 lg:p-8">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    {unitTest?.title ?? ut.defaultTitle}
                  </h1>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{ut.intro}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
                  <Timer className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{formatDurationMs(durationMs)}</span>
                </div>
              </div>

              {!unitTest ? (
                <div className="text-sm text-[var(--text-secondary)]">{ut.unknownUnit}</div>
              ) : submitted && result ? (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">{ut.testCompleted}</p>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {ut.qualityLabel}:{" "}
                        <span className="font-medium text-[var(--text-primary)]">{result.qualityScore}%</span> ·{" "}
                        {ut.timeLabel}:{" "}
                        <span className="font-medium text-[var(--text-primary)]">
                          {formatDurationMs(result.durationMs)}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[var(--accent)]" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">{ut.premiumReward}</p>
                      </div>
                      {result.yourRank ? (
                        <>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {ut.finishedRank.replace(
                              "{rank}",
                              String(result.yourRank),
                            )}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            {ut.premiumExpires}{" "}
                            {new Date(result.premiumExpiresAt ?? "").toLocaleString()}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--text-secondary)]">{ut.notTopThree}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                      >
                        {ut.goToDashboard}
                      </button>
                      <button
                        onClick={() => router.push(`/learn/${unitTest.unitKey}`)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
                      >
                        {ut.backToUnit}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="space-y-3">
                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
                      {errorMsg}
                    </div>
                  )}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--progress-track)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                    <span>
                      {ut.question} {index + 1}/{total}
                    </span>
                    <span>
                      {ut.answered} {answeredCount}/{total}
                    </span>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 md:p-5">
                    <p className="mb-3 text-base font-medium leading-relaxed text-[var(--text-primary)] md:text-[15px]">
                      {q?.prompt}
                    </p>

                    <div className="space-y-2">
                      {q?.options.map((opt, optIdx) => {
                        const chosen = answers[q.id];
                        const selected = chosen === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setAnswers((prev) => ({
                                ...prev,
                                [q.id]: optIdx,
                              }))
                            }
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all ${
                              selected
                                ? "border-blue-500 bg-blue-500/15 text-[var(--text-primary)] dark:border-blue-500/50 dark:bg-blue-500/10"
                                : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)]"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => setIndex((i) => Math.max(0, i - 1))}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ut.prev}
                      </button>
                      <button
                        type="button"
                        disabled={index >= total - 1}
                        onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ut.next}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={!canSubmit || submitting}
                      className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting
                        ? ut.submitting
                        : submitLabel || ut.submitWithQuality}
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

