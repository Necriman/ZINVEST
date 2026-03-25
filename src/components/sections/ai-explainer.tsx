"use client";

import React from 'react';
import { Sparkles, CheckCircle2, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';

export default function AIExplainer() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const { t } = useLanguage();
  
  const features = [
    t.ai.feature1,
    t.ai.feature2,
    t.ai.feature3,
    t.ai.feature4
  ];
  
  return (
    <section ref={ref} className="relative px-6 py-24 bg-[#0a0f1c]">
      {/* Background Decorative Element */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[100px]"></div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="glass-card overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="grid items-center gap-12 p-8 md:grid-cols-2 md:p-16">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="flex flex-col space-y-6"
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                {t.ai.badge}
              </div>
              
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                {t.ai.title} <span className="text-gradient bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">{t.ai.titleHighlight}</span>
              </h2>
              
              <p className="text-lg leading-relaxed text-slate-400">
                {t.ai.subtitle}
              </p>
              
              <ul className="space-y-4 pt-4">
                {features.map((item, index) => (
                  <motion.li 
                    key={index} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-blue-400" />
                    <span className="text-slate-300">{item}</span>
                  </motion.li>
                ))}
              </ul>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="pt-4"
              >
                <Link href="/turbo-ai" className="group relative inline-block">
                  <div className="absolute -inset-1 rounded-full bg-blue-500 opacity-25 blur-lg transition duration-500 group-hover:opacity-50"></div>
                  <span className="relative inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-600 active:scale-95">
                    {t.ai.tryButton}
                    <Sparkles className="h-4 w-4" />
                  </span>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Chat Interface */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Outer Shadow/Glow */}
              <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-500/10 blur-2xl"></div>
              
              <div className="relative flex flex-col rounded-3xl border border-white/10 bg-[#0d1117] shadow-2xl">
                {/* Chat Header */}
                <div className="flex items-center gap-2 border-b border-white/5 p-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-white">{t.ai.chatTitle}</span>
                </div>

                {/* Chat Messages */}
                <div className="flex flex-col space-y-6 p-6">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-blue-600 px-4 py-3 text-sm text-white shadow-lg">
                      {t.ai.userQuestion}
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] space-y-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 px-5 py-4 text-sm leading-relaxed text-slate-300">
                      <p>{t.ai.aiResponse1}</p>
                      <p>
                        <strong className="text-white">{t.ai.revenue}</strong> {t.ai.aiResponse2}
                      </p>
                      <p>
                        <strong className="text-white">{t.ai.profit}</strong> {t.ai.aiResponse3}
                      </p>
                      <p className="text-blue-400 italic">
                        {t.ai.aiResponse4}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="p-4 pt-0">
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      placeholder={t.ai.inputPlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      disabled
                    />
                    <button className="absolute right-2 flex h-8 w-10 items-center justify-center rounded-xl bg-blue-500 text-white transition-transform hover:scale-105 active:scale-95">
                      <span className="text-xs font-bold uppercase tracking-wider">{t.ai.askButton}</span>
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
