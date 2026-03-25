"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  Wallet, ArrowLeft, BookOpen, Clock, Users, Play, 
  CheckCircle2, Lock, Sparkles 
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useLanguage } from "@/lib/language-context";
import AuthGate from "@/components/auth-gate";

export default function PersonalFinancePage() {
  const { t, language } = useLanguage();

  const pdfUrlByLessonId = (lessonId: number) => {
    if (lessonId === 1) {
      if (language === "ru") return "/pdfs/Finance_Unit1_Russian_Zinvest.pdf";
      if (language === "uz") return "/pdfs/Finance_Unit1_Uzbek_Zinvest.pdf";
      return "/pdfs/Finance_Unit1_English_Zinvest.pdf";
    }
    if (lessonId === 2) {
      if (language === "ru") return "/pdfs/Finance_Unit2_Russian_Zinvest.pdf";
      if (language === "uz") return "/pdfs/Finance_Unit2_Uzbek_Zinvest.pdf";
      return "/pdfs/Finance_Unit2_English_Zinvest.pdf";
    }
    return null;
  };

  const openPdfForLessonId = (lessonId: number) => {
    const url = pdfUrlByLessonId(lessonId);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const LESSONS = [
    { id: 1, title: t.trackPage.financialMindset, duration: "10 min", completed: true, unlocked: true },
    { id: 2, title: t.trackPage.financialGoals, duration: "12 min", completed: true, unlocked: true },
    { id: 3, title: t.trackPage.buildingBudget, duration: "15 min", completed: false, unlocked: true, current: true },
    { id: 4, title: t.trackPage.emergencyFunds, duration: "10 min", completed: false, unlocked: true },
    { id: 5, title: t.trackPage.whatIsMoney, duration: "12 min", completed: false, unlocked: true },
    { id: 6, title: t.trackPage.understandingCashFlow, duration: "8 min", completed: false, unlocked: false },
    { id: 7, title: t.trackPage.revenueVsProfit, duration: "14 min", completed: false, unlocked: false },
    { id: 8, title: t.trackPage.debtManagement, duration: "12 min", completed: false, unlocked: false },
    { id: 9, title: t.trackPage.creditScores, duration: "10 min", completed: false, unlocked: false },
    { id: 10, title: t.trackPage.bankingBasics, duration: "15 min", completed: false, unlocked: false },
    { id: 11, title: t.trackPage.assetsAndLiabilities, duration: "14 min", completed: false, unlocked: false },
    { id: 12, title: t.trackPage.financialStatements101, duration: "12 min", completed: false, unlocked: false },
    { id: 13, title: t.trackPage.financialGoals, duration: "10 min", completed: false, unlocked: false },
    { id: 14, title: t.trackPage.financialMindset, duration: "18 min", completed: false, unlocked: false },
  ];

  const [selectedLesson, setSelectedLesson] = useState(LESSONS.find(l => l.current) || LESSONS[0]);
  const completedCount = LESSONS.filter(l => l.completed).length;
  const progress = (completedCount / LESSONS.length) * 100;

  return (
    <AuthGate>
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />
      
      <section className="relative px-6 pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[100px]"></div>
          <div className="absolute bottom-1/4 -right-32 h-[350px] w-[350px] rounded-full bg-orange-500/10 blur-[100px]"></div>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Link href="/learn" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" />
              {t.trackPage.backToCourses}
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <Wallet className="h-7 w-7 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white md:text-4xl">{t.trackPage.personalFinance}</h1>
                <p className="text-slate-400 mt-1">{t.trackPage.personalFinanceDesc}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 mt-6">
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" />14 {t.trackPage.lessonsCount}</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" />2.5 {t.trackPage.hoursTotal}</div>
              <div className="flex items-center gap-2"><Users className="h-4 w-4" />3,120 {t.trackPage.students}</div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-400">{t.trackPage.yourProgress}</span>
                <span className="text-amber-400 font-medium">{completedCount}/{LESSONS.length} {t.trackPage.completed}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, delay: 0.3 }} className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-4 max-h-[600px] overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4 px-2">{t.trackPage.courseContent}</h3>
                <div className="space-y-1">
                  {LESSONS.map((lesson, idx) => (
                    <button
                      key={lesson.id}
                      onClick={() => lesson.unlocked && setSelectedLesson(lesson)}
                      disabled={!lesson.unlocked}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                        selectedLesson.id === lesson.id ? "bg-amber-500/20 border border-amber-500/30" : lesson.unlocked ? "hover:bg-white/5" : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        lesson.completed ? "bg-amber-500/20 text-amber-400" : lesson.unlocked ? "bg-white/10 text-slate-400" : "bg-white/5 text-slate-600"
                      }`}>
                        {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : lesson.unlocked ? <span className="text-xs font-bold">{idx + 1}</span> : <Lock className="h-3.5 w-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${lesson.unlocked ? "text-white" : "text-slate-500"}`}>{lesson.title}</p>
                        <p className="text-xs text-slate-500">{lesson.duration}</p>
                      </div>
                      {lesson.current && <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">{t.trackPage.current}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="lg:col-span-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/5"></div>
                  <div
                    className="group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-amber-500/10 transition-all hover:scale-110 hover:bg-amber-500/20"
                    onClick={() => openPdfForLessonId(selectedLesson.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="absolute inset-0 animate-ping rounded-full bg-amber-400/20"></div>
                    <Play className="h-8 w-8 fill-amber-500 text-amber-500 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <span>{t.trackPage.lessonOf.replace("{current}", String(selectedLesson.id)).replace("{total}", String(LESSONS.length))}</span>
                    <span>•</span>
                    <span>{selectedLesson.duration}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">{selectedLesson.title}</h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    {t.trackPage.lessonDescription}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => openPdfForLessonId(selectedLesson.id)}
                      className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-600 active:scale-95"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      {selectedLesson.completed ? t.trackPage.watchAgain : t.trackPage.startLesson}
                    </button>
                    <Link href="/turbo-ai">
                      <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10">
                        <Sparkles className="h-4 w-4 text-blue-400" />
                        {t.trackPage.askAITutor}
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="glass-card rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.trackPage.keyTakeaways}</h3>
                <ul className="space-y-3">
                  {[
                    t.trackPage.takeaway1,
                    t.trackPage.takeaway2,
                    t.trackPage.takeaway3,
                    t.trackPage.takeaway4
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Unit Test CTA */}
              <div className="glass-card rounded-2xl p-6 mt-6 bg-white/[0.03] border border-white/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Unit Test</h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Finish top-3 to unlock Premium for 3/2/1 days.
                    </p>
                  </div>
                  <Link
                    href="/learn/personal-finance/test"
                    className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                  >
                    Start Test
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
    </AuthGate>
  );
}
