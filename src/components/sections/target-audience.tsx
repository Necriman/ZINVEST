"use client";

import React from 'react';
import { GraduationCap, Briefcase, Lightbulb, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { slideUpVariants, viewportOnce, useReducedMotion } from '@/lib/motion';

const TargetAudience = () => {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();

  const audiences = [
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: t.audience.students,
      description: t.audience.studentsDesc
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: t.audience.youngProfessionals,
      description: t.audience.youngProfessionalsDesc
    },
    {
      icon: <Rocket className="h-6 w-6" />,
      title: t.audience.founders,
      description: t.audience.foundersDesc
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: t.audience.sideHustlers,
      description: t.audience.sideHustlersDesc
    }
  ];

  return (
    <section id="who-its-for" className="relative bg-[var(--bg-card)] px-4 py-16 sm:px-6 sm:py-24">
      {/* Section top gradient divider */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--bg-primary)] to-transparent opacity-60" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={slideUpVariants(0, 0.6)}
          className="text-center mb-16"
        >
          <h2 className="text-[clamp(1.375rem,3vw+0.75rem,3rem)] font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
            {t.audience.title} <span className="text-gradient">{t.audience.titleHighlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              initial={reducedMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group glass-card flex flex-col items-center text-center rounded-2xl p-8 transition-[border-color,transform] duration-300 hover:border-blue-500/30 hover:bg-[var(--bg-card)]/[0.08] hover:scale-[1.02]"
            >
              <motion.div
                className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300"
                initial={reducedMotion ? false : { scale: 0.9, opacity: 0.6 }}
                whileInView={reducedMotion ? undefined : { scale: [1, 1.3, 1], opacity: 1 }}
                viewport={viewportOnce}
                transition={{ type: "spring", stiffness: 320, damping: 14, delay: index * 0.08 }}
              >
                {audience.icon}
              </motion.div>
              <h3 className="mb-3 text-xl font-semibold text-[var(--text-primary)]">
                {audience.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {audience.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute bottom-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
          }}
        />
      </div>
    </section>
  );
};

export default TargetAudience;
