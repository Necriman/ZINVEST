"use client";

import React from "react";
import {
  DollarSign, TrendingUp, BarChart3, Wallet,
  BookOpen, Clock, Lock, Zap, CheckCircle2,
  ChevronRight, Play, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useZiners } from "@/lib/ziners-context";
import { motion } from "framer-motion";

const UNIT_DATA = [
  {
    num: "01",
    icon: DollarSign,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    accent: "border-l-emerald-500",
    tag: "Beginner",
    tagColor: "bg-emerald-100 text-emerald-700",
    coins: 240,
    duration: "2h",
    lessons: 12,
    href: "/courses/finance-fundamentals",
    topics: ["Budgeting", "Cash Flow", "Profit & Loss"],
    keyPoints: [
      "How money moves inside a business",
      "Read and understand a basic P&L",
      "Build a simple personal budget",
    ],
  },
  {
    num: "02",
    icon: TrendingUp,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
    accent: "border-l-blue-500",
    tag: "Beginner",
    tagColor: "bg-blue-100 text-blue-700",
    coins: 200,
    duration: "1.5h",
    lessons: 10,
    href: "/learn/investing-basics",
    topics: ["Stocks", "Risk & Return", "Diversification"],
    keyPoints: [
      "Core investing principles for beginners",
      "How to assess risk vs. return trade-offs",
      "Build a diversified starter portfolio",
    ],
  },
  {
    num: "03",
    icon: BarChart3,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50",
    accent: "border-l-purple-500",
    tag: "Intermediate",
    tagColor: "bg-purple-100 text-purple-700",
    coins: 320,
    duration: "2h",
    lessons: 8,
    href: "/learn/financial-analysis",
    topics: ["Balance Sheet", "Ratios", "Valuation"],
    keyPoints: [
      "Read financial statements like a pro",
      "Calculate and interpret key ratios",
      "Spot red flags in company reports",
    ],
  },
  {
    num: "04",
    icon: Wallet,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    accent: "border-l-amber-500",
    tag: "Beginner",
    tagColor: "bg-amber-100 text-amber-700",
    coins: 280,
    duration: "2.5h",
    lessons: 14,
    href: "/learn/personal-finance",
    topics: ["Savings", "Debt", "Wealth Building"],
    keyPoints: [
      "Set up an emergency fund that actually works",
      "Pay off debt using proven frameworks",
      "Automate savings and wealth-building habits",
    ],
  },
];

export default function LearnPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { coins } = useZiners();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      router.push("/sign-in?redirect=" + encodeURIComponent(href));
    }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navigation />

      <section className="px-4 pt-28 pb-20 sm:px-6">
        <div className="mx-auto max-w-5xl">

          {/* Header — SAT Station style */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-10"
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-2">Learning units</p>
            <h1 className="text-[36px] font-extrabold text-[var(--text-primary)] leading-tight mb-3">
              Learn, practice, master.
            </h1>
            <p className="text-[16px] text-[var(--text-muted)] max-w-xl">
              Start with the basics, then build up. Each unit unlocks the next and earns you Coins.
            </p>

            {/* Stats bar */}
            <div className="mt-6 flex flex-wrap gap-4">
              {[
                { icon: BookOpen, val: "44", label: "lessons total", color: "text-blue-500" },
                { icon: Clock, val: "8+", label: "hours content", color: "text-emerald-500" },
                { icon: Zap, val: "1,040", label: "Coins available", color: "text-amber-500" },
              ].map(({ icon: Icon, val, label, color }) => (
                <div key={label} className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">{val}</span>
                  <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Unit cards — SAT Station list style */}
          <div className="space-y-4">
            {UNIT_DATA.map((unit, idx) => {
              const Icon = unit.icon;
              const locked = !user;
              return (
                <motion.div
                  key={unit.num}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                >
                  <Link
                    href={unit.href}
                    onClick={(e) => handleClick(e, unit.href)}
                    className={`group block bg-[var(--bg-card)] border border-[var(--border)] border-l-4 ${unit.accent} rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Icon + Number */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                          <div className={`w-12 h-12 ${unit.iconBg} rounded-xl flex items-center justify-center`}>
                            <Icon className={`h-6 w-6 ${unit.iconColor}`} />
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text-muted)]">{unit.num}</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${unit.tagColor}`}>
                                  {unit.tag}
                                </span>
                                {locked && (
                                  <span className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                                    <Lock className="h-3 w-3" /> Sign in to unlock
                                  </span>
                                )}
                              </div>
                              <h3 className="text-[17px] font-bold text-[var(--text-primary)]">
                                {idx === 0 ? t.learnPage.financeFundamentals
                                  : idx === 1 ? t.learnPage.investingBasics
                                  : idx === 2 ? t.learnPage.financialAnalysis
                                  : t.learnPage.personalFinance}
                              </h3>
                              <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
                                {idx === 0 ? t.learnPage.financeFundamentalsDesc
                                  : idx === 1 ? t.learnPage.investingBasicsDesc
                                  : idx === 2 ? t.learnPage.financialAnalysisDesc
                                  : t.learnPage.personalFinanceDesc}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{unit.lessons}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{unit.duration}</span>
                                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                  <Zap className="h-3.5 w-3.5" />{unit.coins}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Topics pills */}
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {unit.topics.map((topic) => (
                              <span key={topic} className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)] font-medium">
                                {topic}
                              </span>
                            ))}
                          </div>

                          {/* Key points */}
                          <div className="grid sm:grid-cols-3 gap-2">
                            {unit.keyPoints.map((point, pi) => (
                              <div key={pi} className="flex items-start gap-1.5">
                                <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${unit.iconColor}`} />
                                <span className="text-[12px] text-[var(--text-muted)] leading-snug">{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Arrow */}
                        <ChevronRight className="h-5 w-5 text-[var(--text-muted)] flex-shrink-0 mt-1 group-hover:text-[var(--text-primary)] transition-colors" />
                      </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className={`px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between`}>
                      <span className="text-[12px] text-[var(--text-muted)]">
                        {locked ? "Create a free account to start" : "Continue learning →"}
                      </span>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-primary)]">
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Start unit
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex items-center justify-between gap-4 flex-wrap"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest opacity-80 mb-1">Your learning plan</p>
              <p className="text-[20px] font-bold">Start with Unit 01 — Finance Fundamentals.</p>
              <p className="text-[13px] opacity-80 mt-1">No guesswork. A clear route from basics to mastery.</p>
            </div>
            <Link
              href={user ? "/courses/finance-fundamentals" : "/onboarding"}
              className="flex items-center gap-2 bg-white text-blue-700 font-bold px-5 py-3 rounded-xl hover:bg-blue-50 transition-colors text-[14px] flex-shrink-0"
            >
              {user ? "Begin Unit 01" : "Get started"} <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

        </div>
      </section>

      <Footer />
    </main>
  );
}
