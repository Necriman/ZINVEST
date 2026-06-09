"use client";

import React from "react";
import { DollarSign, TrendingUp, BarChart3, Wallet, ArrowRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { slideUpVariants, viewportOnce, useReducedMotion } from "@/lib/motion";

export default function FinanceTracks() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();

  const TRACKS = [
    {
      icon: <DollarSign className="h-5 w-5 text-emerald-400" />,
      title: t.tracks.financeFundamentals,
      description: t.tracks.financeFundamentalsDesc,
      lessons: 12,
      iconBg: "bg-emerald-500/10",
      href: "/courses/finance-fundamentals"
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-400" />,
      title: t.tracks.investingBasics,
      description: t.tracks.investingBasicsDesc,
      lessons: 10,
      iconBg: "bg-blue-500/10",
      href: "/learn/investing-basics"
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-400" />,
      title: t.tracks.financialAnalysis,
      description: t.tracks.financialAnalysisDesc,
      lessons: 8,
      iconBg: "bg-purple-500/10",
      href: "/learn/financial-analysis"
    },
    {
      icon: <Wallet className="h-5 w-5 text-amber-400" />,
      title: t.tracks.personalFinance,
      description: t.tracks.personalFinanceDesc,
      lessons: 14,
      iconBg: "bg-amber-500/10",
      href: "/learn/personal-finance"
    }
  ];

  return (
    <section id="finance-tracks" className="relative bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-24">
      {/* Section top gradient divider */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg-primary)] to-transparent opacity-60" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]"></div>
        <div className="absolute top-1/2 right-0 h-96 w-96 -translate-y-1/2 rounded-full bg-blue-600/5 blur-[120px]"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideUpVariants(0, 0.6)}
          className="mb-12 text-center sm:mb-16"
        >
          <h2 className="text-[clamp(1.375rem,3vw+0.75rem,3rem)] font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
            {t.tracks.title} <span className="text-gradient">{t.tracks.titleHighlight}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] text-[var(--text-secondary)] sm:text-lg">
            {t.tracks.subtitle}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((track, idx) => (
            <motion.div
              key={idx}
              initial={reducedMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Link href={track.href} className="group block h-full">
                <div
                  className="glass-card relative flex h-full cursor-pointer flex-col rounded-3xl border border-[var(--border)] bg-[var(--bg-primary)] p-8 shadow-[var(--shadow)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-blue-500/35 hover:shadow-[var(--shadow-md)]"
                >
                  {!user && (
                    <div className="badge-shimmer absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                      <Lock className="h-3 w-3 shrink-0" />
                      {t.learnHub.signInToAccess}
                    </div>
                  )}
                  <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${track.iconBg}`}>
                    {track.icon}
                  </div>
                  <h3 className="mb-3 text-[20px] font-semibold text-[var(--text-primary)] transition-colors group-hover:text-blue-600">
                    {track.title}
                  </h3>
                  <p className="mb-6 flex-grow text-sm leading-relaxed text-[var(--text-secondary)]">
                    {track.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {track.lessons} {t.tracks.lessonsCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent)]">
                      {t.tracks.startTrack}
                      <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
