"use client";

import React from "react";
import {
  ArrowRight, Play, Wallet, TrendingUp, ShieldCheck, BarChart3, Rocket, Trophy, Star,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { useReducedMotion } from "@/lib/motion";

const FLOATING_BADGES: { label: string; color: string; icon: LucideIcon; top?: string; left?: string; right?: string; bottom?: string }[] = [
  { label: "Cash Flow", color: "bg-emerald-500", icon: Wallet, top: "18%", left: "8%" },
  { label: "Investing", color: "bg-blue-500", icon: TrendingUp, top: "12%", right: "10%" },
  { label: "Risk Analysis", color: "bg-purple-500", icon: ShieldCheck, bottom: "28%", left: "6%" },
  { label: "Budgeting", color: "bg-amber-500", icon: BarChart3, bottom: "24%", right: "8%" },
  { label: "Startup Finance", color: "bg-rose-500", icon: Rocket, top: "55%", left: "4%" },
];

const HeroSection = () => {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] flex flex-col">
      {/* Top subtle accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />

      {/* ── HERO MAIN ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16 sm:px-6 text-center">

        {/* Floating topic badges */}
        {!reducedMotion && (
          <div className="pointer-events-none absolute inset-0">
            {FLOATING_BADGES.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.label}
                  className={`absolute hidden lg:flex items-center gap-2 ${b.color} text-white text-[13px] font-semibold px-4 py-2 rounded-full shadow-lg`}
                  style={{ top: b.top, left: b.left, right: b.right, bottom: b.bottom }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: [0, -8, 0] }}
                  transition={{
                    opacity: { delay: 0.6 + i * 0.15, duration: 0.5 },
                    y: { delay: 0.6 + i * 0.15, duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {b.label}
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="relative mx-auto max-w-4xl">
          {/* Overline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-4"
          >
            YOUR TARGET LEVEL. YOUR FINANCIAL FUTURE.
          </motion.p>

          {/* Big number / headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <h1 className="text-[clamp(60px,10vw,120px)] font-extrabold leading-none tracking-tight text-[var(--text-primary)] mb-2">
              Finance
            </h1>
            <h1 className="text-[clamp(60px,10vw,120px)] font-extrabold leading-none tracking-tight bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">
              mastery.
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-[17px] text-[var(--text-muted)] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Learn investing, budgeting, and startup finance with AI. Zinvest shows you exactly what to fix — then drills it until it sticks.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/onboarding"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-semibold px-7 py-3.5 rounded-full transition-colors shadow-lg shadow-blue-500/30"
            >
              Start preparation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-2 border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] text-[15px] font-medium px-7 py-3.5 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Play className="h-4 w-4 text-[var(--text-muted)]" />
              See platform
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── PRACTICE ENGINE section (SAT Station style) ── */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-4">PRACTICE ENGINE</p>
            <h2 className="text-[38px] font-extrabold text-[var(--text-primary)] leading-tight mb-6">
              Learn, practice,<br />analyze.
            </h2>
            <p className="text-[15px] text-[var(--text-muted)] mb-8">
              Start with a knowledge check. Zinvest shows what to fix next.
            </p>
            <div className="space-y-4">
              {[
                { label: "Unit lessons", desc: "4 complete financial units" },
                { label: "AI Tutor", desc: "Ask questions in every lesson" },
                { label: "Startup tracker", desc: "Track your real business cash flow" },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <span className="text-[15px] font-semibold text-[var(--text-primary)]">{label}</span>
                  <span className="text-[14px] text-[var(--text-muted)]">{desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Mock app window */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[11px] text-[var(--text-muted)]">Zinvest — Finance Fundamentals</span>
              </div>
              <div className="p-5">
                <p className="text-[11px] text-[var(--text-muted)] mb-1">Lesson 1 · ~45 min · Unit 01</p>
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-3">What is Cash Flow?</h3>
                <div className="space-y-2 mb-4">
                  {["Cash flow is the net amount of money moving in and out of a business over a period of time.", "Positive cash flow means more money comes in than goes out."].map((t, i) => (
                    <p key={i} className="text-[13px] text-[var(--text-muted)] leading-relaxed">{t}</p>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">KEY IDEA</p>
                  <p className="text-[13px] text-blue-900">Cash flow ≠ profit. A profitable business can still run out of cash.</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white text-[12px] font-semibold py-2 rounded-lg">Mark complete</button>
                  <button className="flex-1 border border-[var(--border)] text-[var(--text-secondary)] text-[12px] font-medium py-2 rounded-lg">Next lesson →</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── DARK SECTION (SAT Station "Take one test") ── */}
      <div className="bg-[#0a0f1c] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-[38px] font-extrabold leading-tight mb-4">
              Take one test.<br />See what costs you<br />knowledge points.
            </h2>
            <p className="text-[15px] text-slate-400 mb-8">
              No guesswork. Just a clear route from your first baseline to financial mastery.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-colors"
            >
              Start your first test <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Journey map */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm">
              {[
                { label: "Baseline", x: 10, y: 80, color: "#3b82f6" },
                { label: "Analyze", x: 35, y: 50, color: "#8b5cf6" },
                { label: "Practice", x: 65, y: 65, color: "#10b981" },
                { label: "Mastery", x: 90, y: 20, color: "#f59e0b" },
              ].map((node) => (
                <div
                  key={node.label}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full border-4 border-white/20 flex items-center justify-center text-white font-bold text-[12px]"
                    style={{ backgroundColor: node.color }}
                  />
                  <span className="text-[11px] text-slate-300 mt-1 whitespace-nowrap font-medium">{node.label}</span>
                </div>
              ))}
              <svg className="w-full h-40" viewBox="0 0 100 100" fill="none">
                <path d="M10,80 Q25,30 35,50 Q50,70 65,65 Q80,60 90,20" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="space-y-6 mb-12">
            {[
              { name: "Aziz K.", badge: "+3 Units done", text: "Everything is in one place: units, AI tutor, cash flow tracker. I understood P&L in one week.", stars: 5 },
              { name: "Madina S.", badge: "Streak: 14 days", text: "The risk analysis tool showed me exactly where my startup was losing money. Game changer.", stars: 5 },
            ].map((r) => (
              <div key={r.name} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-[var(--text-primary)]">{r.name}</p>
                      <p className="text-[12px] font-semibold text-blue-600">{r.badge}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array(r.stars).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                </div>
                <p className="text-[14px] text-[var(--text-muted)] italic">&ldquo;{r.text}&rdquo;</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-[28px] font-extrabold text-[var(--text-primary)] mb-3">
              Learners need a plan,<br />not another random course.
            </h2>
            <p className="text-[15px] text-[var(--text-muted)] mb-8">
              Zinvest turns your financial gaps into focused next steps.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-full transition-colors"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
