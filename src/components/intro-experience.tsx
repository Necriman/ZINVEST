"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import type { Language } from "@/lib/translations";
import { useReducedMotion } from "@/lib/motion";
import { ZinvestMark } from "@/components/brand/zinvest-logo";
import { Flag } from "@/components/brand/flag";
import { Check, ArrowRight } from "lucide-react";

const INTRO_DONE_KEY = "zinvest-intro-done";

const LANGS: { id: Language; native: string; sub: string }[] = [
  { id: "en", native: "English", sub: "Continue in English" },
  { id: "ru", native: "Русский", sub: "Продолжить на русском" },
  { id: "uz", native: "O'zbek", sub: "O'zbek tilida davom etish" },
];

type Phase = "splash" | "language";

export function IntroExperience() {
  const { language, setLanguage } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("splash");
  const [selected, setSelected] = useState<Language>(language);

  useEffect(() => {
    try {
      if (!localStorage.getItem(INTRO_DONE_KEY)) setMounted(true);
    } catch {}
  }, []);

  // Auto-advance from splash → language
  useEffect(() => {
    if (!mounted) return;
    if (reducedMotion) {
      setPhase("language");
      return;
    }
    const t = setTimeout(() => setPhase("language"), 2800);
    return () => clearTimeout(t);
  }, [mounted, reducedMotion]);

  const confirm = () => {
    setLanguage(selected);
    try { localStorage.setItem(INTRO_DONE_KEY, "1"); } catch {}
    setMounted(false);
  };

  if (!mounted) return null;

  const word = "Zinvest".split("");

  return (
    <AnimatePresence>
      <motion.div
        key="intro-root"
        className="fixed inset-0 z-[1000] flex items-center justify-center overflow-hidden bg-[#070b16]"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Ambient glow orbs */}
        <motion.div
          className="pointer-events-none absolute h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(35,69,255,0.35) 0%, transparent 65%)" }}
          animate={reducedMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="pointer-events-none absolute -left-40 top-1/4 h-[400px] w-[400px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -right-32 bottom-1/4 h-[360px] w-[360px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(56,189,248,0.35) 0%, transparent 70%)" }}
        />

        <AnimatePresence mode="wait">
          {/* ── SPLASH ── */}
          {phase === "splash" && (
            <motion.div
              key="splash"
              className="relative z-10 flex flex-col items-center"
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.4 } }}
            >
              {/* Mark */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 180, delay: 0.1 }}
                className="relative mb-7"
              >
                <div
                  className="absolute inset-0 blur-2xl"
                  style={{ background: "radial-gradient(circle, rgba(35,69,255,0.6), transparent 70%)" }}
                />
                <ZinvestMark className="relative h-24 w-24" color="#ffffff" />
              </motion.div>

              {/* Wordmark — staggered letters */}
              <div className="flex overflow-hidden">
                {word.map((ch, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="text-[44px] font-extrabold tracking-tight text-white sm:text-[56px]"
                  >
                    {ch}
                  </motion.span>
                ))}
              </div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="mt-3 text-[14px] font-medium tracking-[0.2em] text-slate-400 uppercase"
              >
                AI Financial Mastery
              </motion.p>

              {/* Loading line */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="mt-10 h-[3px] w-40 overflow-hidden rounded-full bg-white/10"
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#2345FF] to-[#60a5fa]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1.4, duration: 1.3, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          )}

          {/* ── LANGUAGE SELECTION ── */}
          {phase === "language" && (
            <motion.div
              key="language"
              className="relative z-10 w-full max-w-[420px] px-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Mark on top */}
              <div className="mb-6 flex flex-col items-center">
                <ZinvestMark className="mb-3 h-12 w-12" color="#ffffff" />
                <h2 className="text-[24px] font-bold text-white">Choose your language</h2>
                <p className="mt-1 text-[13px] text-slate-400">
                  Выберите язык · Tilni tanlang
                </p>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {LANGS.map((lang, i) => {
                  const active = selected === lang.id;
                  return (
                    <motion.button
                      key={lang.id}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      onClick={() => setSelected(lang.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left backdrop-blur-md transition-all ${
                        active
                          ? "border-[#2345FF] bg-white/[0.08] shadow-lg shadow-[#2345FF]/20"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                      }`}
                    >
                      <Flag code={lang.id} className="h-8 w-8 shrink-0 rounded-full ring-1 ring-white/15" />
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-white">{lang.native}</p>
                        <p className="text-[12px] text-slate-400">{lang.sub}</p>
                      </div>
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                          active ? "border-[#2345FF] bg-[#2345FF]" : "border-white/25"
                        }`}
                      >
                        {active && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Continue */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={confirm}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2345FF] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1a37d6]"
              >
                {selected === "ru" ? "Продолжить" : selected === "uz" ? "Davom etish" : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
