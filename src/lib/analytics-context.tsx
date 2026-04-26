"use client";

import React, { createContext, useContext, useEffect, useCallback, ReactNode, useRef } from "react";
import { getSupabase } from "./supabase";
import { useAuth } from "./auth-context";
import { usePathname } from "next/navigation";

// --- Types ---
export interface VisitEvent {
  id: string;
  timestamp: string;
  page: string;
  referrer: string;
  userAgent: string;
  userId?: string;
  sessionId: string;
}

export interface SignupEvent {
  id: string;
  timestamp: string;
  userId: string;
  name: string;
  email: string;
}

export interface PageViewEvent {
  id: string;
  timestamp: string;
  page: string;
  userId?: string;
  sessionId: string;
}

export interface AnalyticsStats {
  totalVisits: number;
  uniqueSessions: number;
  totalPageViews: number;
  totalSignups: number;
  todayVisits: number;
  todaySignups: number;
  thisWeekVisits: number;
  thisWeekSignups: number;
  thisMonthVisits: number;
  thisMonthSignups: number;
  topPages: { page: string; count: number }[];
  signupsByDay: { date: string; count: number }[];
  visitsByDay: { date: string; count: number }[];
  userActivityByUserId: Record<
    string,
    {
      userId: string;
      lastActiveAt: string | null;
      lastPage: string | null;
      visitsCount: number;
      pageViewsCount: number;
    }
  >;
  activeUsers: {
    userId: string;
    lastActiveAt: string;
    lastPage: string | null;
    visitsCount: number;
    pageViewsCount: number;
  }[];
}

// --- localStorage fallback keys ---
const LS_VISITS_KEY = "zinvest-analytics-visits";
const LS_SIGNUPS_KEY = "zinvest-analytics-signups";
const LS_PAGEVIEWS_KEY = "zinvest-analytics-pageviews";
const SESSION_ID_KEY = "zinvest-session-id";

function createId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = createId();
    sessionStorage.setItem(SESSION_ID_KEY, sid);
  }
  return sid;
}

function lsGet<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

function lsAppend<T>(key: string, item: T) {
  const items = lsGet<T>(key);
  items.push(item);
  if (items.length > 10000) items.splice(0, items.length - 10000);
  localStorage.setItem(key, JSON.stringify(items));
}

function computeStats(visits: VisitEvent[], signups: SignupEvent[], pageViews: PageViewEvent[]): AnalyticsStats {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 6 * 86400000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const uniqueSessions = new Set(visits.map(v => v.sessionId)).size;
  const pageCounts: Record<string, number> = {};
  pageViews.forEach(pv => { pageCounts[pv.page] = (pageCounts[pv.page] || 0) + 1; });
  const topPages = Object.entries(pageCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const signupsByDay: { date: string; count: number }[] = [];
  const visitsByDay: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(todayStart - i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    const next = d.getTime() + 86400000;
    signupsByDay.push({ date: dateStr, count: signups.filter(s => { const t = new Date(s.timestamp).getTime(); return t >= d.getTime() && t < next; }).length });
    visitsByDay.push({ date: dateStr, count: visits.filter(v => { const t = new Date(v.timestamp).getTime(); return t >= d.getTime() && t < next; }).length });
  }

  // Per-user activity summary (used by the admin portal).
  const activityByUser: Record<
    string,
    {
      userId: string;
      lastActiveAtMs: number;
      lastPage: string | null;
      visitsCount: number;
      pageViewsCount: number;
    }
  > = {};

  for (const v of visits) {
    if (!v.userId) continue;
    const ts = new Date(v.timestamp).getTime();
    const entry =
      activityByUser[v.userId] ??
      {
        userId: v.userId,
        lastActiveAtMs: ts,
        lastPage: v.page ?? null,
        visitsCount: 0,
        pageViewsCount: 0,
      };
    entry.visitsCount += 1;
    if (ts >= entry.lastActiveAtMs) {
      entry.lastActiveAtMs = ts;
      entry.lastPage = v.page ?? null;
    }
    activityByUser[v.userId] = entry;
  }

  for (const pv of pageViews) {
    if (!pv.userId) continue;
    const ts = new Date(pv.timestamp).getTime();
    const entry =
      activityByUser[pv.userId] ??
      {
        userId: pv.userId,
        lastActiveAtMs: ts,
        lastPage: pv.page ?? null,
        visitsCount: 0,
        pageViewsCount: 0,
      };
    entry.pageViewsCount += 1;
    if (ts >= entry.lastActiveAtMs) {
      entry.lastActiveAtMs = ts;
      entry.lastPage = pv.page ?? null;
    }
    activityByUser[pv.userId] = entry;
  }

  const userActivityByUserId: AnalyticsStats["userActivityByUserId"] = {};
  const activeUsers = Object.values(activityByUser)
    .map((a) => ({
      userId: a.userId,
      lastActiveAt: new Date(a.lastActiveAtMs).toISOString(),
      lastPage: a.lastPage,
      visitsCount: a.visitsCount,
      pageViewsCount: a.pageViewsCount,
    }))
    .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())
    .slice(0, 10);

  for (const a of Object.values(activityByUser)) {
    userActivityByUserId[a.userId] = {
      userId: a.userId,
      lastActiveAt: new Date(a.lastActiveAtMs).toISOString(),
      lastPage: a.lastPage,
      visitsCount: a.visitsCount,
      pageViewsCount: a.pageViewsCount,
    };
  }

  return {
    totalVisits: visits.length,
    uniqueSessions,
    totalPageViews: pageViews.length,
    totalSignups: signups.length,
    todayVisits: visits.filter(v => new Date(v.timestamp).getTime() >= todayStart).length,
    todaySignups: signups.filter(s => new Date(s.timestamp).getTime() >= todayStart).length,
    thisWeekVisits: visits.filter(v => new Date(v.timestamp).getTime() >= weekStart).length,
    thisWeekSignups: signups.filter(s => new Date(s.timestamp).getTime() >= weekStart).length,
    thisMonthVisits: visits.filter(v => new Date(v.timestamp).getTime() >= monthStart).length,
    thisMonthSignups: signups.filter(s => new Date(s.timestamp).getTime() >= monthStart).length,
    topPages,
    signupsByDay,
    visitsByDay,
    userActivityByUserId,
    activeUsers,
  };
}

// --- Context ---
interface AnalyticsContextType {
  trackPageView: (page: string, userId?: string) => void;
  trackSignup: (userId: string, name: string, email: string) => void;
  getVisits: () => Promise<VisitEvent[]>;
  getSignups: () => Promise<SignupEvent[]>;
  getPageViews: () => Promise<PageViewEvent[]>;
  getStats: () => Promise<AnalyticsStats>;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const visitsTrackedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (visitsTrackedRef.current) return;
    visitsTrackedRef.current = true;

    const sessionId = getSessionId();
    const page = typeof window !== "undefined" ? window.location.pathname : "/";
    const referrer = typeof document !== "undefined" ? (document.referrer || "direct") : "direct";
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

    if (isSupabaseConfigured()) {
      getSupabase()!.from("visits").insert({
        session_id: sessionId,
        page,
        referrer,
        user_agent: userAgent,
        user_id: user?.id ?? null,
      }).then(() => {});
    } else {
      const visit: VisitEvent = {
        id: createId(),
        timestamp: new Date().toISOString(),
        page,
        referrer,
        userAgent,
        sessionId,
        userId: user?.id,
      };
      lsAppend(LS_VISITS_KEY, visit);
    }
  }, [authLoading, user?.id]);

  const trackPageView = useCallback((page: string, userId?: string) => {
    const sessionId = getSessionId();
    if (isSupabaseConfigured()) {
      getSupabase()!.from("page_views").insert({
        session_id: sessionId,
        user_id: userId || null,
        page,
      }).then(() => {});
    } else {
      lsAppend(LS_PAGEVIEWS_KEY, {
        id: createId(),
        timestamp: new Date().toISOString(),
        page,
        userId,
        sessionId,
      } as PageViewEvent);
    }
  }, []);

  // Automatically record page views on route changes.
  useEffect(() => {
    if (authLoading) return;
    if (!pathname) return;
    trackPageView(pathname, user?.id);
  }, [authLoading, pathname, user?.id, trackPageView]);

  const trackSignup = useCallback((userId: string, name: string, email: string) => {
    // Supabase signup tracking is handled directly in auth-context after insert
    // This is kept for localStorage fallback only
    if (!isSupabaseConfigured()) {
      lsAppend(LS_SIGNUPS_KEY, {
        id: createId(),
        timestamp: new Date().toISOString(),
        userId,
        name,
        email,
      } as SignupEvent);
    }
  }, []);

  const getVisits = useCallback(async (): Promise<VisitEvent[]> => {
    if (isSupabaseConfigured()) {
      const { data } = await getSupabase()!
        .from("visits")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);
      return (data || []).map(r => ({
        id: r.id,
        timestamp: r.created_at,
        page: r.page,
        referrer: r.referrer,
        userAgent: r.user_agent,
        userId: r.user_id || undefined,
        sessionId: r.session_id,
      }));
    }
    return lsGet<VisitEvent>(LS_VISITS_KEY);
  }, []);

  const getSignups = useCallback(async (): Promise<SignupEvent[]> => {
    if (isSupabaseConfigured()) {
      const { data } = await getSupabase()!
        .from("signups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);
      return (data || []).map(r => ({
        id: r.id,
        timestamp: r.created_at,
        userId: r.user_id,
        name: r.name,
        email: r.email,
      }));
    }
    return lsGet<SignupEvent>(LS_SIGNUPS_KEY);
  }, []);

  const getPageViews = useCallback(async (): Promise<PageViewEvent[]> => {
    if (isSupabaseConfigured()) {
      const { data } = await getSupabase()!
        .from("page_views")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);
      return (data || []).map(r => ({
        id: r.id,
        timestamp: r.created_at,
        page: r.page,
        userId: r.user_id || undefined,
        sessionId: r.session_id,
      }));
    }
    return lsGet<PageViewEvent>(LS_PAGEVIEWS_KEY);
  }, []);

  const getStats = useCallback(async (): Promise<AnalyticsStats> => {
    const [visits, signups, pageViews] = await Promise.all([
      getVisits(),
      getSignups(),
      getPageViews(),
    ]);
    return computeStats(visits, signups, pageViews);
  }, [getVisits, getSignups, getPageViews]);

  return (
    <AnalyticsContext.Provider value={{ trackPageView, trackSignup, getVisits, getSignups, getPageViews, getStats }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within AnalyticsProvider");
  return ctx;
}
