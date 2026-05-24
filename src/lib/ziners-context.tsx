"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const COINS_KEY = "zinvest-ziners-coins";
const STREAK_KEY = "zinvest-ziners-streak";
const LAST_ACTIVE_KEY = "zinvest-ziners-last-active";
const STREAK_HISTORY_KEY = "zinvest-streak-history";

export const AI_QUESTION_COST = 5;
export const INITIAL_COINS = 50;

export type StreakNotification = {
  isNew: boolean;
  streakDay: number;
  coinsAwarded: number;
};

type ZinersContextType = {
  coins: number;
  streak: number;
  streakHistory: Record<string, number>;
  streakNotification: StreakNotification | null;
  dismissStreakNotification: () => void;
  spendCoins: (amount: number) => boolean;
  awardCoins: (amount: number) => void;
  recordActivity: () => { isNew: boolean; streakDay: number; coinsAwarded: number };
};

const ZinersContext = createContext<ZinersContextType>({
  coins: INITIAL_COINS,
  streak: 0,
  streakHistory: {},
  streakNotification: null,
  dismissStreakNotification: () => {},
  spendCoins: () => false,
  awardCoins: () => {},
  recordActivity: () => ({ isNew: false, streakDay: 0, coinsAwarded: 0 }),
});

export function ZinersProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState(INITIAL_COINS);
  const [streak, setStreak] = useState(0);
  const [streakHistory, setStreakHistory] = useState<Record<string, number>>({});
  const [streakNotification, setStreakNotification] = useState<StreakNotification | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const storedCoins = localStorage.getItem(COINS_KEY);
      const storedStreak = localStorage.getItem(STREAK_KEY);
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      const storedHistory = localStorage.getItem(STREAK_HISTORY_KEY);

      if (storedCoins !== null) setCoins(Math.max(0, parseInt(storedCoins) || INITIAL_COINS));
      if (storedStreak !== null) setStreak(Math.max(0, parseInt(storedStreak) || 0));
      if (storedHistory) {
        try { setStreakHistory(JSON.parse(storedHistory)); } catch {}
      }

      if (lastActive) {
        const last = new Date(lastActive).toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const today = new Date().toDateString();
        if (last !== today && last !== yesterday) {
          setStreak(0);
          localStorage.setItem(STREAK_KEY, "0");
        }
      }
    } catch {}
    setReady(true);
  }, []);

  // Auto-record daily activity and trigger streak notification
  useEffect(() => {
    if (!ready) return;
    const today = new Date().toDateString();
    const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
    if (lastActive === today) return;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "0");
    const newStreak = lastActive === yesterday ? currentStreak + 1 : 1;
    const bonus = newStreak % 7 === 0 ? 50 : newStreak % 3 === 0 ? 25 : 10;

    setStreak(newStreak);
    setCoins(prev => prev + bonus);
    localStorage.setItem(STREAK_KEY, String(newStreak));
    localStorage.setItem(LAST_ACTIVE_KEY, today);

    setStreakHistory(prev => {
      const updated = { ...prev, [today]: bonus };
      try { localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });

    setStreakNotification({ isNew: true, streakDay: newStreak, coinsAwarded: bonus });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(COINS_KEY, String(coins)); } catch {}
  }, [coins, ready]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STREAK_KEY, String(streak)); } catch {}
  }, [streak, ready]);

  const dismissStreakNotification = useCallback(() => {
    setStreakNotification(null);
  }, []);

  const spendCoins = useCallback((amount: number): boolean => {
    const current = parseInt(localStorage.getItem(COINS_KEY) || String(INITIAL_COINS));
    if (current < amount) return false;
    setCoins(prev => Math.max(0, prev - amount));
    return true;
  }, []);

  const awardCoins = useCallback((amount: number) => {
    setCoins(prev => prev + amount);
  }, []);

  const recordActivity = useCallback(() => {
    try {
      const today = new Date().toDateString();
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive === today) return { isNew: false, streakDay: streak, coinsAwarded: 0 };

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const currentStreak = parseInt(localStorage.getItem(STREAK_KEY) || "0");
      const newStreak = lastActive === yesterday ? currentStreak + 1 : 1;
      const bonus = newStreak % 7 === 0 ? 50 : newStreak % 3 === 0 ? 25 : 10;

      setStreak(newStreak);
      setCoins(prev => prev + bonus);
      localStorage.setItem(STREAK_KEY, String(newStreak));
      localStorage.setItem(LAST_ACTIVE_KEY, today);

      setStreakHistory(prev => {
        const updated = { ...prev, [today]: bonus };
        try { localStorage.setItem(STREAK_HISTORY_KEY, JSON.stringify(updated)); } catch {}
        return updated;
      });

      return { isNew: true, streakDay: newStreak, coinsAwarded: bonus };
    } catch {
      return { isNew: false, streakDay: 0, coinsAwarded: 0 };
    }
  }, [streak]);

  return (
    <ZinersContext.Provider value={{ coins, streak, streakHistory, streakNotification, dismissStreakNotification, spendCoins, awardCoins, recordActivity }}>
      {children}
    </ZinersContext.Provider>
  );
}

export const useZiners = () => useContext(ZinersContext);
