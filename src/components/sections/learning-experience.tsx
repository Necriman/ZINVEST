"use client";

import React from 'react';
import { Play, BookOpen, CircleCheck, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useLanguage } from '@/lib/language-context';

const LearningExperience = () => {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
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
    <section id="learning" ref={ref} className="relative px-6 py-24 overflow-hidden bg-[#0a0f1c]">
      {/* Background Glow Effect */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px]"></div>
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl leading-[1.2]">
              {t.learning.title} <span className="text-gradient">{t.learning.titleHighlight}</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-400 max-w-xl">
              {t.learning.subtitle}
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {features.map((feature, index) => (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 group cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-base">
                      {feature.title}
                    </h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Video Preview Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative lg:ml-auto w-full max-w-[560px]"
          >
            <div className="glass-card overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1117] shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-200">{t.hero.cashFlowBasics}</span>
                </div>
                <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                  {t.learning.lessonOf}
                </span>
              </div>

              {/* Video Player Mockup */}
              <div className="relative aspect-video w-full bg-[#0a0f1c] px-4 pt-4">
                <div className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center">
                  <div className="absolute inset-0 bg-blue-500/5"></div>
                  <div className="group relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-blue-500/10 transition-all hover:scale-110 hover:bg-blue-500/20">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/20"></div>
                    <Play className="h-6 w-6 fill-blue-500 text-blue-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>

              {/* Card Footer Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-white">{t.learning.videoTitle}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  {t.learning.videoDesc}
                </p>
                <div className="mt-6 flex items-center gap-6 border-t border-white/5 pt-6">
                  <span className="text-xs text-slate-500">{t.learning.minRead}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                  <span className="text-xs text-slate-500">{t.learning.videoIncluded}</span>
                  <div className="h-1 w-1 rounded-full bg-slate-700"></div>
                  <span className="text-xs text-slate-500">{t.learning.quizAtEnd}</span>
                </div>
              </div>
            </div>

            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LearningExperience;
