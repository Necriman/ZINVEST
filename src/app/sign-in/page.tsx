"use client";

import React, { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowLeft, Eye, EyeOff, BookOpen, Bot, Flame, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";
import { ZinvestLogo, ZinvestMark, BRAND, BRAND_HOVER } from "@/components/brand/zinvest-logo";
import { Flag } from "@/components/brand/flag";

const LANGS: Language[] = ["en", "ru", "uz"];

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const labels = {
    title: language === "ru" ? "С возвращением" : language === "uz" ? "Xush kelibsiz" : "Welcome back",
    sub: language === "ru" ? "Войдите, чтобы продолжить обучение" : language === "uz" ? "O'qishni davom ettirish uchun kiring" : "Sign in to continue your learning",
    emailLabel: language === "ru" ? "Электронная почта" : language === "uz" ? "Elektron pochta" : "Email",
    passLabel: language === "ru" ? "Пароль" : language === "uz" ? "Parol" : "Password",
    btn: language === "ru" ? "Войти" : language === "uz" ? "Kirish" : "Sign In",
    loading: language === "ru" ? "Вход..." : language === "uz" ? "Kirmoqda..." : "Signing in...",
    google: language === "ru" ? "Войти через Google" : language === "uz" ? "Google orqali kirish" : "Continue with Google",
    noAcc: language === "ru" ? "Нет аккаунта?" : language === "uz" ? "Akkount yo'qmi?" : "Don't have an account?",
    signUp: language === "ru" ? "Зарегистрироваться" : language === "uz" ? "Ro'yxatdan o'tish" : "Sign Up",
    back: language === "ru" ? "На главную" : language === "uz" ? "Bosh sahifa" : "Back to Home",
    or: language === "ru" ? "или" : language === "uz" ? "yoki" : "or",
    forgot: language === "ru" ? "Забыли пароль?" : language === "uz" ? "Parolni unutdingizmi?" : "Forgot password?",
  };

  const sidePoints = [
    { icon: BookOpen, label: language === "ru" ? "Финансовая грамотность" : language === "uz" ? "Moliyaviy savodxonlik" : "Financial literacy", sub: language === "ru" ? "4 полных юнита" : language === "uz" ? "4 ta to'liq bo'lim" : "4 complete units" },
    { icon: Bot, label: "Zinvest AI", sub: language === "ru" ? "ИИ-репетитор в каждом уроке" : language === "uz" ? "Har darsda AI repetitor" : "AI tutor in every lesson" },
    { icon: Flame, label: language === "ru" ? "Серия дней" : language === "uz" ? "Kunlik seriya" : "Daily streak", sub: language === "ru" ? "Зарабатывайте монеты" : language === "uz" ? "Tangalar yig'ing" : "Earn coins every day" },
    { icon: Wallet, label: language === "ru" ? "Cash Flow трекер" : language === "uz" ? "Cash Flow tracker" : "Cash Flow tracker", sub: language === "ru" ? "Для вашего стартапа" : language === "uz" ? "Startapingiz uchun" : "For your startup" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email, password);
    if (result.success) router.push(redirect);
    else setError(result.error || "Something went wrong.");
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef1ff] via-[#f4f6ff] to-[#fef3e2] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col w-[320px] bg-white/70 backdrop-blur-sm border-r border-white/60 p-8 flex-shrink-0">
        <ZinvestLogo className="mb-10" />
        <div className="space-y-3 mb-auto">
          {sidePoints.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/70">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eef1ff" }}>
                <Icon className="h-4.5 w-4.5" style={{ color: BRAND }} />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#0f172a]">{label}</p>
                <p className="text-[11px] text-gray-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-6">
          {LANGS.map((l) => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all border ${language === l ? "text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
              style={language === l ? { backgroundColor: BRAND } : undefined}
            >
              <Flag code={l} className="h-3.5 w-3.5 rounded-full" /> {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[440px]">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-1.5 text-[14px] text-gray-500 hover:text-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" /> {labels.back}
            </Link>
            <div className="flex gap-1 lg:hidden">
              {LANGS.map((l) => (
                <button key={l} onClick={() => setLanguage(l)} className={`p-1 rounded-lg border transition-all ${language === l ? "border-[#2345FF]" : "border-gray-200"}`}>
                  <Flag code={l} className="h-4 w-4 rounded-full" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:hidden mb-8"><ZinvestLogo /></div>

          <h1 className="text-[28px] font-bold text-[#0f172a] mb-1">{labels.title}</h1>
          <p className="text-[14px] text-gray-500 mb-7">{labels.sub}</p>

          <button onClick={handleGoogle} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-[#2345FF] text-[#0f172a] text-[15px] font-semibold py-3.5 rounded-2xl transition-all mb-4 disabled:opacity-60">
            <GoogleIcon />
            {googleLoading ? "..." : labels.google}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[12px] text-gray-400 font-medium">{labels.or}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-[13px] text-red-600">{error}</motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#0f172a] mb-1.5">{labels.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
                  className="w-full rounded-xl border-2 border-gray-200 focus:border-[#2345FF] bg-white pl-10 pr-4 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 outline-none transition-all" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-semibold text-[#0f172a]">{labels.passLabel}</label>
                <button type="button" className="text-[12px] hover:underline" style={{ color: BRAND }}>{labels.forgot}</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full rounded-xl border-2 border-gray-200 focus:border-[#2345FF] bg-white pl-10 pr-11 py-3 text-[14px] text-[#0f172a] placeholder-gray-300 outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full text-white text-[15px] font-semibold py-3.5 rounded-2xl transition-colors disabled:opacity-60 mt-1"
              style={{ backgroundColor: BRAND }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND)}>
              {loading ? labels.loading : labels.btn}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-gray-500">
            {labels.noAcc}{" "}
            <Link href="/sign-up" className="font-semibold hover:underline" style={{ color: BRAND }}>{labels.signUp}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#eef1ff] to-[#fef3e2] flex items-center justify-center">
        <ZinvestMark className="h-10 w-10 animate-pulse" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
