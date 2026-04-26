"use client";

import React from 'react';
import { CircleCheck, Play, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

const AppPreview = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
  const features = [
    t.appPreview.feature1,
    t.appPreview.feature2,
    t.appPreview.feature3
  ];
  
  return (
    <section id="app-preview" ref={ref} className="relative bg-white dark:bg-[#0a0f1c] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="glass-card overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--bg-primary)] backdrop-blur-sm">
          <div className="grid items-center gap-10 p-4 sm:gap-12 sm:p-8 md:grid-cols-2 md:p-16">
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="flex flex-col"
            >
              <h2 className="text-[clamp(1.25rem,2.5vw+0.75rem,2.5rem)] font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-[40px]">
                {t.appPreview.title}
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-[18px]">
                {t.appPreview.subtitle}
              </p>
              
              <ul className="mt-10 space-y-5">
                {features.map((item, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CircleCheck className="h-5 w-5 text-[#3b82f6]" strokeWidth={2.5} />
                    <span className="text-[15px] font-medium text-[var(--text-secondary)] sm:text-[16px]">{item}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap"
              >
                <Link href="/modules" className="w-full sm:w-auto">
                  <span className="btn-glow inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#3b82f6] px-6 py-3 text-[15px] font-medium text-white transition-all duration-200 hover:bg-[#2563eb] active:scale-[0.98] sm:w-auto sm:px-8 sm:text-[16px]">
                    {t.appPreview.downloadApp}
                  </span>
                </Link>
                <Link href="/learn" className="w-full sm:w-auto">
                  <span className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-6 py-3 text-[15px] font-medium text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--bg-secondary)] active:scale-[0.98] sm:w-auto sm:px-8 sm:text-[16px]">
                    {t.appPreview.learnMore}
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Mobile Mockup */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center md:justify-end"
            >
              <div className="relative">
                {/* Background Glow */}
                <div className="absolute -inset-10 rounded-full bg-blue-500/20 blur-[80px]"></div>
                
                {/* Phone Frame */}
                <div className="relative h-[500px] w-[250px] overflow-hidden rounded-[2.5rem] border-[6px] border-[#1e293b] bg-[#0d1117] shadow-2xl">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 h-6 w-24 -translate-x-1/2 rounded-b-xl bg-[#1e293b] z-20"></div>
                  
                  {/* Screen Content */}
                  <div className="h-full w-full overflow-hidden bg-white dark:bg-[#0a0f1c] pt-8 px-4">
                    {/* App Header */}
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Welcome back</p>
                        <p className="text-[18px] font-bold text-[var(--text-primary)]">Alex</p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#60a5fa] to-[#2563eb] border border-white/10"></div>
                    </div>

                    {/* Streak Card */}
                    <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] p-4 shadow-lg">
                      <p className="text-[11px] font-medium text-blue-100/80">{t.appPreview.streakTitle}</p>
                      <p className="text-[28px] font-bold text-white leading-none mt-1">{t.appPreview.streakDays}</p>
                      <p className="mt-2 text-[12px] font-medium text-blue-200">{t.appPreview.keepItUp}</p>
                    </div>

                    {/* Active Module */}
                    <div className="mb-6">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.hero.continueLearning}</p>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                        <div className="flex items-center gap-2">
                          <Play className="h-3 w-3 fill-[#3b82f6] text-[#3b82f6]" />
                          <span className="text-[13px] font-semibold text-[var(--text-primary)]">{t.hero.cashFlowBasics}</span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white dark:bg-[#0a0f1c]/10">
                          <div className="h-full w-[65%] rounded-full bg-[#3b82f6]"></div>
                        </div>
                      </div>
                    </div>

                    {/* Modules List */}
                    <div>
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.hero.currentModule}</p>
                      <div className="space-y-2">
                        {[
                          { title: t.hero.finance101, status: t.hero.completed, statusColor: "text-emerald-400" },
                          { title: t.hero.cashFlow, status: "65%", statusColor: "text-[#3b82f6]" },
                          { title: t.hero.taxes, status: "20%", statusColor: "text-slate-500 dark:text-slate-400" }
                        ].map((module, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-[12px] font-medium text-[var(--text-primary)]">{module.title}</span>
                            </div>
                            <span className={`text-[10px] font-bold ${module.statusColor}`}>{module.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppPreview;
