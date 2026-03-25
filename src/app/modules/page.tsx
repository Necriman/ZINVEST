"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, TrendingUp, BarChart3, Wallet, ArrowLeft, 
  BookOpen, CheckCircle2, Play, ArrowRight, Sparkles
} from "lucide-react";
import Link from "next/link";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useLanguage } from "@/lib/language-context";
import AuthGate from "@/components/auth-gate";

export default function ModulesPage() {
  const { t } = useLanguage();

  const MODULES = [
    {
      icon: <DollarSign className="h-6 w-6 text-emerald-400" />,
      title: t.modulesPage.finance101,
      description: t.modulesPage.finance101Desc,
      lessons: 6,
      progress: 100,
      status: t.modulesPage.completed,
      iconBg: "bg-emerald-500/10",
      statusColor: "text-emerald-400",
      href: "/learn/finance-fundamentals"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
      title: t.modulesPage.cashFlow,
      description: t.modulesPage.cashFlowDesc,
      lessons: 5,
      progress: 65,
      status: t.modulesPage.inProgress,
      iconBg: "bg-blue-500/10",
      statusColor: "text-blue-400",
      href: "/learn/finance-fundamentals"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
      title: t.modulesPage.taxes,
      description: t.modulesPage.taxesDesc,
      lessons: 4,
      progress: 20,
      status: "20%",
      iconBg: "bg-purple-500/10",
      statusColor: "text-purple-400",
      href: "/learn/financial-analysis"
    },
    {
      icon: <Wallet className="h-6 w-6 text-amber-400" />,
      title: t.modulesPage.investingBasicsTitle,
      description: t.modulesPage.investingBasicsDesc,
      lessons: 8,
      progress: 0,
      status: t.modulesPage.notStarted,
      iconBg: "bg-amber-500/10",
      statusColor: "text-slate-500",
      href: "/learn/investing-basics"
    }
  ];

  const QUICK_ACTIONS = [
    {
      icon: <Play className="h-5 w-5" />,
      title: t.modulesPage.continueLearning,
      description: t.modulesPage.continueLearningDesc,
      href: "/learn/finance-fundamentals",
      color: "bg-blue-500"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: t.modulesPage.askZinvestAI,
      description: t.modulesPage.askZinvestAIDesc,
      href: "/turbo-ai",
      color: "bg-purple-500"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: t.modulesPage.browseCourses,
      description: t.modulesPage.browseCoursesDesc,
      href: "/learn",
      color: "bg-emerald-500"
    }
  ];

  const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons, 0);
  const completedLessons = MODULES.reduce((acc, m) => acc + Math.round((m.progress / 100) * m.lessons), 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  return (
    <AuthGate>
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />
      
      <section className="relative px-6 pt-32 pb-24">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]"></div>
          <div className="absolute bottom-1/4 -right-32 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[100px]"></div>
        </div>

        <div className="relative mx-auto max-w-7xl">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" />
              {t.modulesPage.backToHome}
            </Link>
          </motion.div>

          {/* Header with Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12"
          >
            <h1 className="text-3xl font-bold text-white md:text-4xl mb-2">{t.modulesPage.title}</h1>
            <p className="text-slate-400">{t.modulesPage.subtitle}</p>
            
            {/* Overall Progress */}
            <div className="mt-8 glass-card rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{t.modulesPage.overallProgress}</p>
                  <p className="text-3xl font-bold text-white">{overallProgress}%</p>
                  <p className="text-sm text-slate-500 mt-1">{completedLessons} / {totalLessons} {t.modulesPage.lessonsCompleted}</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">1</p>
                    <p className="text-xs text-slate-500">{t.modulesPage.completed}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">2</p>
                    <p className="text-xs text-slate-500">{t.modulesPage.inProgress}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-500">1</p>
                    <p className="text-xs text-slate-500">{t.modulesPage.notStarted}</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Modules List */}
            <div className="lg:col-span-2">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl font-semibold text-white mb-6"
              >
                {t.modulesPage.yourModules}
              </motion.h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {MODULES.map((module, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  >
                    <Link href={module.href}>
                      <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:scale-[1.02] h-full group">
                        <div className="flex items-start gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${module.iconBg} transition-transform group-hover:scale-110`}>
                            {module.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-white truncate">{module.title}</h3>
                              <span className={`text-xs font-medium ${module.statusColor} shrink-0`}>
                                {module.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-400 mb-3">{module.description}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{module.lessons} {t.learnPage.lessons}</span>
                            </div>
                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div 
                                className={`h-full rounded-full ${module.progress === 100 ? 'bg-emerald-400' : 'bg-blue-400'}`}
                                style={{ width: `${module.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-xl font-semibold text-white mb-6"
              >
                {t.modulesPage.quickActions}
              </motion.h2>
              <div className="space-y-4">
                {QUICK_ACTIONS.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  >
                    <Link href={action.href}>
                      <div className="glass-card rounded-xl p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] group">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color} text-white transition-transform group-hover:scale-110`}>
                            {action.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{action.title}</h4>
                            <p className="text-xs text-slate-400">{action.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Learning Streak */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-8 glass-card rounded-2xl p-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
              >
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">{t.modulesPage.learningStreak}</p>
                  <p className="text-4xl font-bold text-white mb-1">7 {t.modulesPage.days}</p>
                  <p className="text-sm text-blue-400">{t.modulesPage.keepItUp}</p>
                </div>
                <div className="flex justify-center gap-2 mt-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center"
                    >
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
    </AuthGate>
  );
}
