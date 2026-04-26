"use client";

import React from 'react';
import { Target, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '@/lib/language-context';

const HowItWorks = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
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
      ref={ref}
      className="relative px-4 py-16 sm:px-6 sm:py-24 bg-white dark:bg-[#0a0f1c]"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center sm:mb-16"
        >
          <h2 className="text-[clamp(1.375rem,3vw+0.75rem,3rem)] font-bold tracking-tight text-[var(--text-primary)] md:text-5xl font-display">
            {t.howItWorks.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] text-[var(--text-secondary)] leading-relaxed sm:text-lg">
            {t.howItWorks.subtitle}
          </p>
        </motion.div>

        {/* 4-column Grid of Glassmorphic Cards */}
        <div className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group glass-card flex cursor-pointer flex-col rounded-2xl p-5 transition-all duration-300 hover:border-blue-500/30 sm:p-6 sm:hover:scale-[1.02]"
            >
              {/* Blue-tinted Icon Container */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20">
                {step.icon}
              </div>
              
              {/* Content */}
              <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)] font-display">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
