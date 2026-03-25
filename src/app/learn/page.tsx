"use client";

import React from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, BarChart3, Wallet, ArrowRight, BookOpen, Clock, Users, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";

export default function LearnPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const TRACKS = [
    {
      icon: <DollarSign className="h-6 w-6 text-emerald-400" />,
      title: t.learnPage.financeFundamentals,
      description: t.learnPage.financeFundamentalsDesc,
      lessons: 12,
      duration: "2 hours",
      students: "2,340",
      iconBg: "bg-emerald-500/10",
      href: "/learn/finance-fundamentals",
      color: "emerald"
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-blue-400" />,
      title: t.learnPage.investingBasics,
      description: t.learnPage.investingBasicsDesc,
      lessons: 10,
      duration: "1.5 hours",
      students: "1,890",
      iconBg: "bg-blue-500/10",
      href: "/learn/investing-basics",
      color: "blue"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
      title: t.learnPage.financialAnalysis,
      description: t.learnPage.financialAnalysisDesc,
      lessons: 8,
      duration: "2 hours",
      students: "1,250",
      iconBg: "bg-purple-500/10",
      href: "/learn/financial-analysis",
      color: "purple"
    },
    {
      icon: <Wallet className="h-6 w-6 text-amber-400" />,
      title: t.learnPage.personalFinance,
      description: t.learnPage.personalFinanceDesc,
      lessons: 14,
      duration: "2.5 hours",
      students: "3,120",
      iconBg: "bg-amber-500/10",
      href: "/learn/personal-finance",
      color: "amber"
    }
  ];

  const handleTrackClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      router.push("/sign-in?redirect=" + encodeURIComponent(href));
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />
      
      <section className="relative px-6 pt-32 pb-24">
        {/* Background Blurs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]"></div>
          <div className="absolute top-1/3 -right-32 h-[350px] w-[350px] rounded-full bg-purple-500/10 blur-[100px]"></div>
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
              {t.learnPage.backToHome}
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm mb-6">
              <BookOpen className="h-4 w-4 text-blue-400" />
              {t.learnPage.badge}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              {t.learnPage.title} <span className="text-gradient">{t.learnPage.titleHighlight}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
              {t.learnPage.subtitle}
            </p>
          </motion.div>

          {/* Track Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {TRACKS.map((track, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
              >
                <Link href={track.href} onClick={(e) => handleTrackClick(e, track.href)}>
                    <div className="group glass-card rounded-3xl p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07] hover:scale-[1.02] h-full relative">
                      {!user && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                          <Lock className="h-3 w-3" />
                          Sign in to access
                        </div>
                      )}
                      <div className="flex items-start gap-5">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${track.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                        {track.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                          {track.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">
                          {track.description}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-6 text-xs text-slate-500 mb-6">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {track.lessons} {t.learnPage.lessons}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {track.duration}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {track.students} {t.learnPage.students}
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                          {t.learnPage.startLearning}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
