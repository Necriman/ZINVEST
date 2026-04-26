"use client";

import React from 'react';
import { 
  ArrowRight, 
  Play, 
  Calculator, 
  TrendingUp, 
  Receipt, 
  Target 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

const HeroSection = () => {
  const { t } = useLanguage();
  
  return (
    <section
      className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%), var(--bg-primary)",
      }}
    >
      {/* Background Radial Blurs — saturated blues in dark; soft blues in light */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-blue-400/35 blur-[100px] dark:bg-blue-600/45"></div>
        <div className="absolute top-1/3 -right-32 h-[350px] w-[350px] rounded-full bg-sky-400/30 blur-[100px] dark:bg-sky-500/40"></div>
        <div className="absolute bottom-1/4 left-1/3 h-[300px] w-[300px] rounded-full bg-indigo-400/30 blur-[100px] dark:bg-blue-500/35"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 max-w-4xl text-[clamp(48px,7vw,88px)] font-extrabold leading-[1.08] tracking-tight text-[var(--text-primary)]"
          >
            <span className="block sm:inline">{t.hero.headline1}</span>{' '}
            <span className="block bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] bg-clip-text text-transparent sm:inline">
              {t.hero.headline2}
            </span>{' '}
            <span className="block sm:inline">{t.hero.headline3}</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 max-w-2xl text-[15px] leading-relaxed text-[var(--text-tertiary)] sm:text-lg md:text-xl"
          >
            {t.hero.subheadline}
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center"
          >
            <Link href="/learn" className="group relative w-full sm:w-auto">
              <div className="absolute -inset-1 rounded-full opacity-40 blur-md transition-opacity group-hover:opacity-55" style={{ background: "linear-gradient(to right, var(--accent), var(--accent-hover))" }}></div>
              <span className="relative flex min-h-12 items-center justify-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium text-[var(--text-on-accent)] transition-all duration-200 active:scale-[0.98] sm:px-8 sm:text-base" style={{ backgroundColor: "var(--accent)", boxShadow: "0 8px 24px color-mix(in srgb, var(--accent) 45%, transparent)" }}>
                {t.hero.startLearning}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            
            <Link href="/modules" className="w-full sm:w-auto">
              <span className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border px-6 py-3 text-[15px] font-medium transition-all duration-200 active:scale-[0.98] sm:px-8 sm:text-base" style={{ borderColor: "var(--border)", backgroundColor: "color-mix(in srgb, var(--bg-primary) 95%, transparent)", color: "var(--text-primary)" }}>
                <Play className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                {t.hero.exploreApp}
              </span>
            </Link>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 w-full max-w-[900px] sm:mt-24"
          >
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0f1c] p-1.5 backdrop-blur-sm shadow-[0_4px_24px_rgba(15,23,42,0.08)] sm:rounded-[40px] sm:p-2">
              <div className="relative overflow-x-auto rounded-[20px] bg-slate-50 dark:bg-[#0d1117] p-4 sm:overflow-hidden sm:rounded-[32px] sm:p-8">
                {/* Traffic Lights / Header */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f56]"></div>
                    <div className="h-3 w-3 rounded-full bg-[#ffbd2e]"></div>
                    <div className="h-3 w-3 rounded-full bg-[#27c93f]"></div>
                  </div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {t.hero.dashboardTitle}
                  </span>
                </div>

                {/* Top Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0f1c] p-5 text-left">
                    <p className="text-[13px] font-medium text-[var(--text-muted)]">{t.hero.yourProgress}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">12 {t.hero.lessons}</p>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-blue-500 to-blue-400"></div>
                    </div>
                    <p className="mt-2 text-[13px] text-[var(--text-muted)]">65% {t.hero.complete}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0f1c] p-5 text-left">
                    <p className="text-[13px] font-medium text-[var(--text-muted)]">{t.hero.currentModule}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{t.hero.cashFlowBasics}</p>
                    <button className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-500">
                      <Play className="h-3 w-3 fill-blue-600" />
                      {t.hero.continueLearning}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0f1c] p-5 text-left">
                    <p className="text-[13px] font-medium text-[var(--text-muted)]">{t.hero.knowledgeScore}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{t.hero.level} 3</p>
                    <div className="mt-4 flex gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-1.5 flex-1 rounded-full bg-blue-400"></div>
                      ))}
                      {[4, 5].map((i) => (
                        <div key={i} className="h-1.5 flex-1 rounded-full bg-slate-200"></div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Module Grid */}
                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  {[
                    { title: t.hero.finance101, icon: Calculator, progress: 100, status: t.hero.completed, color: 'var(--progress-complete)' },
                    { title: t.hero.cashFlow, icon: TrendingUp, progress: 65, status: '65%', color: 'var(--progress-fill)' },
                    { title: t.hero.taxes, icon: Receipt, progress: 20, status: '20%', color: 'var(--progress-fill)' },
                    { title: t.hero.investing, icon: Target, progress: 0, status: t.hero.notStarted, color: 'var(--progress-track)' }
                  ].map((module, idx) => (
                    <div 
                      key={idx} 
                      className="group/module rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0a0f1c] p-4 text-left transition-all hover:bg-slate-50 dark:bg-[#0d1117]"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover/module:bg-blue-500/20">
                          <module.icon className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">{module.title}</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${module.progress}%`, backgroundColor: module.color }}
                        ></div>
                      </div>
                      <p className="mt-2 text-[13px] font-medium text-[var(--text-muted)]">{module.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
