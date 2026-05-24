"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Flame, X } from "lucide-react";
import { useZiners } from "@/lib/ziners-context";

export function StreakCelebration() {
  const { streakNotification, dismissStreakNotification } = useZiners();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (streakNotification?.isNew) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(dismissStreakNotification, 400);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [streakNotification, dismissStreakNotification]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(dismissStreakNotification, 400);
  };

  if (!streakNotification?.isNew) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/65 backdrop-blur-sm"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: -30 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="relative mx-4 flex flex-col items-center gap-6 rounded-3xl border border-orange-300/30 bg-gradient-to-b from-orange-50 to-amber-50 px-10 py-10 shadow-2xl dark:border-orange-500/20 dark:from-[#1c1000] dark:to-[#140e00]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Flame */}
            <motion.div
              animate={{ scale: [1, 1.18, 0.95, 1.1, 1], rotate: [-6, 6, -4, 4, 0] }}
              transition={{ duration: 0.7, repeat: 2, repeatDelay: 0.4 }}
              className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-red-500 shadow-xl shadow-orange-500/40"
            >
              <Flame className="h-12 w-12 text-white" />
            </motion.div>

            {/* Streak count */}
            <div className="text-center">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-6xl font-black text-orange-600 dark:text-orange-400"
              >
                {streakNotification.streakDay}
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-xl font-bold text-slate-800 dark:text-white"
              >
                Day Streak! 🔥
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-1 text-sm text-slate-500 dark:text-slate-400"
              >
                Keep it up — you&apos;re on fire!
              </motion.p>
            </div>

            {/* Coins reward */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.55, type: "spring", stiffness: 300 }}
              className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-100/90 px-6 py-3 dark:border-amber-500/30 dark:bg-amber-500/15"
            >
              <Image src="/icon-192.png" alt="Zinverts" width={28} height={28} className="rounded-lg" />
              <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">
                +{streakNotification.coinsAwarded} Zinverts
              </span>
            </motion.div>

            <p className="text-xs text-slate-400 dark:text-slate-500">Tap anywhere to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
