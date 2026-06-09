"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { scaleInVariants, viewportOnce } from '@/lib/motion';
import { PulseRingLink } from '@/components/motion/pulse-ring-link';

const CTA = () => {
  const { t } = useLanguage();
  
  return (
    <section className="relative bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={scaleInVariants}
          className="relative overflow-hidden rounded-2xl bg-[#2563eb] px-5 py-12 text-center shadow-2xl sm:rounded-[2.5rem] sm:px-8 sm:py-16 md:px-12 md:py-20"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-[min(100vw,34rem)] w-[min(100vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/20 blur-3xl dark:bg-[#0a0f1c]/15" />
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-blue-400/25 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-700/35 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-[clamp(1.25rem,3vw+0.75rem,3rem)] font-bold tracking-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] sm:text-4xl md:text-5xl">
              {t.cta.title} <span className="text-sky-100">{t.cta.titleHighlight}</span>?
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-white/90 [text-shadow:0_1px_1px_rgba(0,0,0,0.15)] sm:text-lg md:text-xl">
              {t.cta.subtitle}
            </p>

            <div className="mt-8 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:mx-auto sm:max-w-none sm:mt-10 sm:flex-row sm:items-center sm:gap-4">
              <PulseRingLink
                href="/onboarding"
                className="w-full sm:w-auto"
                innerClassName="btn-interactive inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[#2563eb] shadow-lg shadow-black/5 transition-colors duration-200 hover:bg-sky-50 sm:w-auto sm:px-8 sm:text-base dark:bg-[#0a0f1c] dark:text-sky-200 dark:hover:bg-slate-900"
              >
                {t.cta.startFree}
              </PulseRingLink>
              <Link 
                href="/modules" 
                className="btn-interactive inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white shadow-sm backdrop-blur-sm transition-colors duration-200 hover:border-white/60 hover:bg-white/20 sm:w-auto sm:px-8 sm:text-base dark:border-white/25 dark:bg-[#0a0f1c]/20 dark:hover:bg-[#0a0f1c]/40"
              >
                {t.cta.exploreModules}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
