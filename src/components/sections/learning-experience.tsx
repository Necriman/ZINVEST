"use client";

import React from 'react';
import { Play, BookOpen, CircleCheck, Search, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { staggerContainer, slideUpVariants, viewportOnce, useReducedMotion } from '@/lib/motion';

const LearningExperience = () => {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  
  const features = [
    {
      title: t.learning.shortLessons,
      description: t.learning.shortLessonsDesc,
      icon: <Play className="h-5 w-5 text-blue-400" />,
    },
    {
      title: t.learning.videosSummaries,
      description: t.learning.videosSummariesDesc,
      icon: <BookOpen className="h-5 w-5 text-blue-400" />,
    },
    {
      title: t.learning.keyTakeaways,
      description: t.learning.keyTakeawaysDesc,
      icon: <CircleCheck className="h-5 w-5 text-blue-400" />,
    },
    {
      title: t.learning.knowledgeBase,
      description: t.learning.knowledgeBaseDesc,
      icon: <Search className="h-5 w-5 text-blue-400" />,
    },
  ];

  return (
    <section id="learning" className="relative overflow-hidden bg-[var(--bg-primary)] px-4 py-16 sm:px-6 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={slideUpVariants(0, 0.6)}
          >
            <h2 className="text-[clamp(1.375rem,3vw+0.75rem,3rem)] font-bold leading-[1.2] tracking-tight text-[var(--text-primary)] md:text-5xl">
              {t.learning.title} <span className="text-gradient">{t.learning.titleHighlight}</span>
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)] sm:text-lg">
              {t.learning.subtitle}
            </p>

            <motion.div
              className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
              variants={reducedMotion ? undefined : staggerContainer(0.1)}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  variants={slideUpVariants(0, 0.5)}
                  className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-[border-color] duration-200 hover:border-blue-500/30"
                >
                  <motion.div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20"
                    whileHover={
                      reducedMotion
                        ? undefined
                        : { scale: [1, 1.2, 1] }
                    }
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <div>
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {feature.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportOnce}
            transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.2 }}
            className="relative lg:ml-auto w-full max-w-[560px]"
          >
            <div className="glass-card relative min-h-[280px] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--bg-primary)] shadow-[var(--shadow)]">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />
              <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-500/20 blur-[80px]" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-purple-500/15 blur-[70px]" />

              <div className="relative flex min-h-[280px] flex-col items-center justify-center px-8 py-16 text-center">
                <motion.div
                  animate={reducedMotion ? undefined : { opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--accent-bg)]"
                >
                  <Sparkles className="h-7 w-7 text-blue-400" />
                </motion.div>
                <motion.h3
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  variants={slideUpVariants(0.35, 0.5)}
                  className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl"
                >
                  Coming Soon
                </motion.h3>
                <motion.p
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewportOnce}
                  variants={slideUpVariants(0.45, 0.5)}
                  className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]"
                >
                  Intro video from the Zinvest team will be available soon
                </motion.p>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LearningExperience;
