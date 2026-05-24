"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, Flame } from "lucide-react";
import { useZiners } from "@/lib/ziners-context";

interface StreakCalendarProps {
  open: boolean;
  onClose: () => void;
}

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const REWARD_TABLE = [
  { label: "Daily reward", when: "Every day", coins: 10 },
  { label: "3-day streak bonus", when: "Every 3rd day", coins: 25 },
  { label: "Weekly streak bonus", when: "Every 7th day", coins: 50 },
];

export function StreakCalendar({ open, onClose }: StreakCalendarProps) {
  const { streak, streakHistory } = useZiners();

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthLabel = today.toLocaleString("default", { month: "long", year: "numeric" });

  const leadingBlanks = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const dateStr = date.toDateString();
    return {
      day: i + 1,
      dateStr,
      coins: streakHistory[dateStr] ?? null,
      isToday: dateStr === today.toDateString(),
    };
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="relative w-full max-w-sm rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-base font-bold text-[var(--text-primary)]">
                  {streak > 0 ? `${streak}-day streak` : "Start your streak!"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{monthLabel}</p>
              </div>
            </div>

            {/* Calendar */}
            <div className="mb-5">
              <div className="mb-2 grid grid-cols-7 text-center">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {leadingBlanks.map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {monthDays.map(({ day, coins, isToday }) => (
                  <div
                    key={day}
                    className={`flex flex-col items-center justify-center rounded-lg py-1.5 text-xs transition-colors ${
                      isToday
                        ? "bg-orange-500 font-bold text-white"
                        : coins !== null
                          ? "bg-amber-100/80 font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    <span>{day}</span>
                    {coins !== null && (
                      <span className="mt-0.5 text-[9px] font-bold leading-none">
                        +{coins}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reward schedule */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-tertiary)] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Reward Schedule
              </p>
              <div className="space-y-2.5">
                {REWARD_TABLE.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{row.label}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{row.when}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200/60 bg-amber-50/80 px-3 py-1 dark:border-amber-500/25 dark:bg-amber-500/10">
                      <Image src="/icon-192.png" alt="" width={12} height={12} className="rounded" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        +{row.coins}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
