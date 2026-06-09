"use client";

import React from 'react';
import { Target, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { staggerContainer, slideUpVariants, viewportOnce, useReducedMotion } from '@/lib/motion';

const HowItWorks = () => {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  
  const steps = [
    {
      icon: <Target className="h-6 w-6" />,
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Desc
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Desc
    },
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Desc
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: t.howItWorks.step4Title,
      description: t.howItWorks.step4Desc
    }
  ];

  return (
    <section
      id="how-it-works"
      className="relative px-4 py-16 sm:px-6 sm:py-24 bg-[var(--bg-card)]"
    >
      {/* Section top gradient divider */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg-primary)] to-transparent opacity-60" />
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideUpVariants(0, 0.6)}
          className="mb-12 text-center sm:mb-16"
        >
          <h2 className="text-[clamp(1.375rem,3vw+0.75rem,3rem)] font-bold tracking-tight text-[var(--text-primary)] md:text-5xl font-display">
            {t.howItWorks.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-[var(--text-secondary)] leading-relaxed sm:text-lg">
            {t.howItWorks.subtitle}
          </p>
        </motion.div>

        <motion.div
          className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={reducedMotion ? undefined : staggerContainer(0.1)}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={slideUpVariants(index * 0.1, 0.5)}
              whileHover={reducedMotion ? undefined : { scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="group glass-card relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--border)] p-5 transition-[border-color,box-shadow] duration-200 hover:border-blue-500/30 sm:p-6"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-3 text-4xl font-bold tabular-nums text-[var(--accent)] opacity-10 transition-opacity duration-200 group-hover:opacity-50"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20">
                {step.icon}
              </div>
              
              <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)] font-display">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
