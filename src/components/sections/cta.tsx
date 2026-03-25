"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

const CTA = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
  return (
    <section ref={ref} className="relative px-6 py-24 bg-[#0a0f1c]">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#2563eb] px-8 py-16 text-center shadow-2xl md:px-12 md:py-20"
        >
          {/* Background Decorative Element */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 blur-[100px] rounded-full"></div>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-700/30 blur-3xl rounded-full"></div>
          </div>

          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              {t.cta.title} <span className="text-blue-200">{t.cta.titleHighlight}</span>?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-blue-50 md:text-xl opacity-90">
              {t.cta.subtitle}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link 
                href="/learn" 
                className="inline-flex h-14 items-center justify-center rounded-full bg-white px-8 text-base font-semibold text-[#2563eb] transition-all hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/5"
              >
                {t.cta.startFree}
              </Link>
              <Link 
                href="/modules" 
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/30 bg-white/10 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50 active:scale-[0.98]"
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
