"use client";

import React from 'react';
import { GraduationCap, Briefcase, Lightbulb, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '@/lib/language-context';

const TargetAudience = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
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
    <section id="who-its-for" ref={ref} className="relative px-6 py-24 bg-[#0a0f1c]">
      <div className="mx-auto max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            {t.audience.title} <span className="text-gradient">{t.audience.titleHighlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group glass-card flex flex-col items-center text-center rounded-2xl p-8 transition-all duration-300 hover:border-blue-500/30 hover:bg-white/[0.08] hover:scale-[1.02]"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-300">
                {audience.icon}
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                {audience.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400">
                {audience.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Background Decorative Element */}
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
