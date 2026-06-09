"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Check, BookOpen, Bot, Coins, BarChart3, Trophy, Star, Mail,
  Wallet, TrendingUp, ShieldCheck, Building2, Bitcoin, ReceiptText,
  Rocket, Target, PackageOpen, Compass, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";
import { ZinvestMark, ZinvestLogo, BRAND, BRAND_HOVER } from "@/components/brand/zinvest-logo";
import { Flag } from "@/components/brand/flag";

type Challenge = { id: string; label: string; icon: LucideIcon };
type TimelineOption = { id: string; label: string; sub: string; icon: LucideIcon };

const STEPS = [
  { num: 1, label: "Get Started" },
  { num: 2, label: "Your Goal" },
  { num: 3, label: "Language" },
  { num: 4, label: "Challenges" },
  { num: 5, label: "Your Plan" },
  { num: 6, label: "Create Account" },
];

const CHALLENGES: Challenge[] = [
  { id: "budgeting", label: "Budgeting", icon: Wallet },
  { id: "investing", label: "Investing", icon: TrendingUp },
  { id: "risk", label: "Risk Analysis", icon: ShieldCheck },
  { id: "business", label: "Business Finance", icon: Building2 },
  { id: "crypto", label: "Crypto & DeFi", icon: Bitcoin },
  { id: "tax", label: "Tax & Planning", icon: ReceiptText },
];

const TIMELINES: TimelineOption[] = [
  { id: "fast", label: "Less Than a Month", sub: "Focus on high-impact fundamentals", icon: Rocket },
  { id: "medium", label: "1–3 Months", sub: "Build solid knowledge habits", icon: Target },
  { id: "long", label: "3–6 Months", sub: "Grow wealth knowledge steadily", icon: PackageOpen },
  { id: "flexible", label: "No Rush", sub: "Keep the plan flexible", icon: Compass },
];

const LANGS: { id: Language; native: string }[] = [
  { id: "en", native: "English" },
  { id: "ru", native: "Русский" },
  { id: "uz", native: "O'zbek" },
];

const LEVELS = [
  { label: "Beginner" }, { label: "Basic" }, { label: "Intermediate" },
  { label: "Advanced" }, { label: "Expert" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setLanguage } = useLanguage();

  const [step, setStep] = useState(1);
  const [targetLevel, setTargetLevel] = useState(3);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string>("");
  const [lang, setLang] = useState<Language>("en");

  const totalSteps = STEPS.length;
  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const toggleChallenge = (id: string) =>
    setChallenges((p) => (p.includes(id) ? p.filter((c) => c !== id) : [...p, id]));

  const saveAndRedirect = () => {
    try {
      localStorage.setItem("zinvest-onboarding", JSON.stringify({
        targetLevel, challenges, timeline, language: lang, completedAt: new Date().toISOString(),
      }));
      setLanguage(lang);
    } catch {}
    router.push("/sign-up?from=onboarding");
  };

  const selectedLevel = LEVELS[targetLevel - 1];
  const focusArea = challenges.length ? (CHALLENGES.find((c) => c.id === challenges[0])?.label ?? "General Finance") : "General Finance";
  const weeklyGoal = timeline === "fast" ? "60 Min/week" : timeline === "medium" ? "90 Min/week" : "120 Min/week";

  const primaryBtn = (disabled = false) =>
    `w-full text-[16px] font-semibold py-4 rounded-2xl transition-colors ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-white"}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-[#f4f6ff] to-[#fef3e2] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-white/80 backdrop-blur-sm border-r border-white/60 p-8 flex-shrink-0">
        <ZinvestLogo className="mb-10" />
        <div className="space-y-3">
          {STEPS.map((s) => {
            const done = step > s.num;
            const active = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold border-2 transition-all flex-shrink-0"
                  style={
                    done ? { backgroundColor: BRAND, borderColor: BRAND, color: "#fff" }
                    : active ? { borderColor: BRAND, color: BRAND, backgroundColor: "#fff" }
                    : { borderColor: "#e5e7eb", color: "#9ca3af", backgroundColor: "#fff" }
                  }>
                  {done ? <Check className="h-3.5 w-3.5" /> : s.num}
                </div>
                <span className="text-[14px] font-medium transition-colors" style={{ color: active ? BRAND : done ? "#374151" : "#9ca3af" }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-auto pt-6 border-t border-gray-100 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 flex-shrink-0" style={{ color: BRAND }} />
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Your data is private and secure. We build your plan from your answers.
          </p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 min-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[600px] flex flex-col"
          >
            {/* Back + mobile logo */}
            <div className="flex items-center justify-between mb-6">
              {step > 1 ? (
                <button onClick={goBack} className="flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-800 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : <div />}
              <div className="lg:hidden"><ZinvestLogo /></div>
              <div className="hidden lg:block" />
            </div>

            {/* STEP 1 — GET STARTED */}
            {step === 1 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND}, #5b73ff)`, boxShadow: `0 12px 30px ${BRAND}33` }}>
                  <BarChart3 className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-[32px] font-bold text-[#0f172a] leading-tight mb-3">
                  Build your financial<br />literacy plan
                </h1>
                <p className="text-[16px] text-gray-500 mb-8 max-w-[420px]">
                  Answer 5 questions — get a personalized plan for Investing, Budgeting, and Risk Analysis.
                </p>
                <div className="w-full space-y-3 mb-8">
                  {[
                    { icon: BookOpen, label: "LEARNING UNITS", val: "4 complete units", c: BRAND, bg: "#eef1ff" },
                    { icon: Bot, label: "AI TUTOR", val: "Zinvest AI included", c: "#7c3aed", bg: "#f3e8ff" },
                    { icon: Coins, label: "COINS SYSTEM", val: "Earn coins for progress", c: "#d97706", bg: "#fef3c7" },
                  ].map(({ icon: Icon, label, val, c, bg }) => (
                    <div key={label} className="flex items-center gap-3 bg-white/80 rounded-2xl p-4 border border-white shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                        <Icon className="h-5 w-5" style={{ color: c }} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                        <p className="text-[14px] font-semibold text-[#0f172a]">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="w-full">
                  <p className="text-[13px] text-gray-400 mb-4">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="font-semibold hover:underline" style={{ color: BRAND }}>Sign in</Link>
                  </p>
                  <button onClick={goNext} className={primaryBtn()} style={{ backgroundColor: BRAND }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}>
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 — YOUR GOAL */}
            {step === 2 && (
              <div>
                <h1 className="text-[32px] font-bold text-[#0f172a] mb-2">Set your financial goal</h1>
                <p className="text-[16px] text-gray-500 mb-8">Choose the level you want. We&apos;ll tune the route around it.</p>
                <div className="bg-white/90 rounded-2xl border border-white shadow-sm p-6 mb-6">
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <p className="text-[44px] font-extrabold text-[#0f172a] leading-none">{selectedLevel.label}</p>
                      <p className="text-[12px] font-bold uppercase tracking-widest mt-1" style={{ color: BRAND }}>TARGET LEVEL</p>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="text-[13px] font-bold text-gray-600 mb-0.5">SCORE-JUMP ROUTE</p>
                      <p className="text-[14px] font-bold text-[#0f172a]">Turn practice into knowledge you keep.</p>
                    </div>
                  </div>
                  <input type="range" min={1} max={5} value={targetLevel} onChange={(e) => setTargetLevel(Number(e.target.value))}
                    className="w-full h-2 rounded-full cursor-pointer" style={{ accentColor: BRAND }} />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-medium">
                    <span>Beginner</span><span>Expert</span>
                  </div>
                </div>
                <div className="space-y-2 mb-8">
                  {[
                    { num: 1, label: "Baseline", desc: "Start with a knowledge check" },
                    { num: 2, label: "Weak areas", desc: "Find your knowledge gaps" },
                    { num: 3, label: "Next drill", desc: "Practice and reinforce" },
                  ].map((item) => (
                    <div key={item.num} className="flex items-center gap-4 bg-white/80 rounded-xl border border-white px-4 py-3 shadow-sm">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ backgroundColor: "#eef1ff", color: BRAND }}>{item.num}</div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#0f172a]">{item.label}</p>
                        <p className="text-[12px] text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={goNext} className={primaryBtn()} style={{ backgroundColor: BRAND }}>Continue</button>
              </div>
            )}

            {/* STEP 3 — LANGUAGE */}
            {step === 3 && (
              <div>
                <h1 className="text-[32px] font-bold text-[#0f172a] mb-2">Choose your language</h1>
                <p className="text-[16px] text-gray-500 mb-8">All content is available in 3 languages.</p>
                <div className="space-y-3 mb-8">
                  {LANGS.map((l) => (
                    <button key={l.id} onClick={() => setLang(l.id)}
                      className="w-full flex items-center gap-4 bg-white/90 rounded-2xl border-2 px-5 py-4 transition-all text-left"
                      style={{ borderColor: lang === l.id ? BRAND : "transparent", boxShadow: lang === l.id ? `0 6px 16px ${BRAND}1a` : undefined }}>
                      <Flag code={l.id} className="h-8 w-8 rounded-full ring-1 ring-gray-200" />
                      <span className="text-[16px] font-semibold text-[#0f172a] flex-1">{l.native}</span>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                        style={{ borderColor: lang === l.id ? BRAND : "#d1d5db", backgroundColor: lang === l.id ? BRAND : "transparent" }}>
                        {lang === l.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={goNext} className={primaryBtn()} style={{ backgroundColor: BRAND }}>Continue</button>
              </div>
            )}

            {/* STEP 4 — CHALLENGES */}
            {step === 4 && (
              <div>
                <h1 className="text-[32px] font-bold text-[#0f172a] mb-2">What is your biggest challenge?</h1>
                <p className="text-[15px] text-gray-500 mb-7">You can pick a few.</p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {CHALLENGES.map((c) => {
                    const selected = challenges.includes(c.id);
                    const Icon = c.icon;
                    return (
                      <button key={c.id} onClick={() => toggleChallenge(c.id)}
                        className="relative flex items-center gap-3 bg-white/90 rounded-2xl border-2 px-4 py-4 transition-all text-left"
                        style={{ borderColor: selected ? BRAND : "transparent", boxShadow: selected ? `0 6px 16px ${BRAND}1a` : undefined }}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selected ? "#eef1ff" : "#f3f4f6" }}>
                          <Icon className="h-4.5 w-4.5" style={{ color: selected ? BRAND : "#6b7280" }} />
                        </div>
                        <span className="text-[14px] font-semibold text-[#0f172a] flex-1">{c.label}</span>
                        <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ borderColor: selected ? BRAND : "#d1d5db", backgroundColor: selected ? BRAND : "#fff" }}>
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={goNext} disabled={challenges.length === 0} className={primaryBtn(challenges.length === 0)} style={challenges.length ? { backgroundColor: BRAND } : undefined}>
                  Continue
                </button>
              </div>
            )}

            {/* STEP 5 — TIMELINE */}
            {step === 5 && (
              <div>
                <h1 className="text-[32px] font-bold text-[#0f172a] mb-2">When do you want to achieve this?</h1>
                <p className="text-[15px] text-gray-500 mb-7">This helps us build your plan.</p>
                <div className="space-y-3 mb-8">
                  {TIMELINES.map((opt) => {
                    const Icon = opt.icon;
                    const active = timeline === opt.id;
                    return (
                      <button key={opt.id} onClick={() => setTimeline(opt.id)}
                        className="w-full flex items-center gap-4 bg-white/90 rounded-2xl border-2 px-5 py-4 transition-all text-left"
                        style={{ borderColor: active ? BRAND : "transparent", boxShadow: active ? `0 6px 16px ${BRAND}1a` : undefined }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: active ? "#eef1ff" : "#f3f4f6" }}>
                          <Icon className="h-5 w-5" style={{ color: active ? BRAND : "#6b7280" }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[15px] font-semibold text-[#0f172a]">{opt.label}</p>
                          <p className="text-[13px] text-gray-500 mt-0.5">{opt.sub}</p>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ borderColor: active ? BRAND : "#d1d5db", backgroundColor: active ? BRAND : "transparent" }}>
                          {active && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button onClick={goNext} disabled={!timeline} className={primaryBtn(!timeline)} style={timeline ? { backgroundColor: BRAND } : undefined}>
                  Continue
                </button>
              </div>
            )}

            {/* STEP 6 — YOUR PATH + ACCOUNT */}
            {step === 6 && (
              <div>
                <h1 className="text-[28px] font-bold text-[#0f172a] mb-2">
                  Your Path to <span style={{ color: BRAND }}>{selectedLevel.label}</span> Starts Now
                </h1>
                <p className="text-[14px] text-gray-500 mb-6">
                  We&apos;ve analyzed your challenges and timeline to build a custom roadmap that gets you to <strong>{selectedLevel.label}</strong> level efficiently.
                </p>

                <div className="rounded-2xl border p-5 mb-4" style={{ background: "linear-gradient(135deg, #eef1ff, #f7f9ff)", borderColor: "#c7d2fe" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: BRAND }}>PERSONALIZED STRATEGY READY</p>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-[16px] font-bold text-[#0f172a] mb-4">
                    Master <strong>{focusArea}</strong> to build real financial confidence.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "TARGET LEVEL", val: selectedLevel.label },
                      { label: "WEEKLY GOAL", val: weeklyGoal },
                      { label: "FOCUS AREA", val: focusArea },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-white/70 rounded-xl p-3 border border-white">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                        <p className="text-[13px] font-bold text-[#0f172a] mt-0.5">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review */}
                <div className="bg-white/80 rounded-2xl border border-white shadow-sm p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                        <Trophy className="h-4.5 w-4.5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#0f172a]">Aziz K.</p>
                        <p className="text-[11px] font-semibold" style={{ color: BRAND }}>+3 Units done</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array(5).fill(0).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                  <p className="text-[13px] text-gray-600 italic">&ldquo;Everything is in one place: units, AI tutor, cash flow tracker. I understood P&amp;L in one week.&rdquo;</p>
                </div>

                {/* Account */}
                <div className="space-y-3">
                  <button onClick={saveAndRedirect}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#2345FF] text-[#0f172a] text-[15px] font-semibold py-4 rounded-2xl transition-all">
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[12px] text-gray-400">or use another method</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <button onClick={saveAndRedirect}
                    className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 hover:border-gray-300 text-[#0f172a] text-[15px] font-semibold py-4 rounded-2xl transition-all">
                    <Mail className="h-4.5 w-4.5 text-gray-500" /> Continue with Email
                  </button>
                  <p className="text-center text-[13px] text-gray-500">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="font-semibold hover:underline" style={{ color: BRAND }}>Sign in</Link>
                  </p>
                </div>
              </div>
            )}

            {/* Progress dots */}
            {step < 6 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array(totalSteps).fill(0).map((_, i) => (
                  <div key={i} className="rounded-full transition-all"
                    style={
                      i + 1 === step ? { width: 24, height: 8, backgroundColor: BRAND }
                      : i + 1 < step ? { width: 8, height: 8, backgroundColor: "#a5b4fc" }
                      : { width: 8, height: 8, backgroundColor: "#e5e7eb" }
                    } />
                ))}
              </div>
            )}

            {step < 6 && (
              <p className="text-center text-[12px] text-gray-400 mt-3">
                Need help? Email{" "}
                <a href="mailto:support@zinvest.app" className="hover:underline" style={{ color: BRAND }}>support@zinvest.app</a>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
