"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, TrendingUp, BarChart3,
  ArrowLeft, Search, Crown, Eye, Globe,
  DollarSign, UserPlus, Bell, Mail, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAnalytics } from "@/lib/analytics-context";
import type { SignupEvent, AnalyticsStats } from "@/lib/analytics-context";
import type { User } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { ZinvestLogo, ZinvestMark, BRAND } from "@/components/brand/zinvest-logo";

export default function AdminPage() {
  const { t } = useLanguage();
  const a = t.admin;
  const { user, getAllUsers } = useAuth();
  const { getStats, getSignups } = useAnalytics();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [signups, setSignups] = useState<SignupEvent[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "analytics" | "signups" | "revenue">("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [user, mounted, router]);

  const refresh = useCallback(async () => {
    if (!user?.isAdmin) return;
    const [allUsers, allSignups, stats] = await Promise.all([
      getAllUsers(),
      getSignups(),
      getStats(),
    ]);
    setUsers(allUsers);
    setSignups(allSignups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setAnalytics(stats);
  }, [user, getAllUsers, getSignups, getStats]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const revenueStats = useMemo(() => {
    const total = users.length;
    const monthlySubscribers = Math.floor(total * 0.3);
    const semiAnnualSubscribers = Math.floor(total * 0.2);
    const annualSubscribers = Math.floor(total * 0.15);
    const mrr = monthlySubscribers * 14.99 + semiAnnualSubscribers * 10 + annualSubscribers * 7.5;
    return {
      monthlySubscribers, semiAnnualSubscribers, annualSubscribers,
      premiumUsers: monthlySubscribers + semiAnnualSubscribers + annualSubscribers,
      mrr: mrr.toFixed(2),
      conversionRate: total > 0 ? (((monthlySubscribers + semiAnnualSubscribers + annualSubscribers) / total) * 100).toFixed(1) : "0",
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, searchQuery]);

  if (!mounted || !user?.isAdmin || !analytics) {
    return (
      <main className="min-h-screen bg-[#f6f7fb] flex items-center justify-center">
        <ZinvestMark className="h-10 w-10 animate-pulse" />
      </main>
    );
  }

  const formatTimeAgo = (isoString: string | null | undefined): string => {
    if (!isoString) return a.none;
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return a.justNow;
    if (mins < 60) return a.minutesAgo.replace("{n}", String(mins));
    const hours = Math.floor(mins / 60);
    if (hours < 24) return a.hoursAgo.replace("{n}", String(hours));
    return a.daysAgo.replace("{n}", String(Math.floor(hours / 24)));
  };

  const tabs = [
    { id: "overview" as const, label: a.overview, icon: BarChart3 },
    { id: "users" as const, label: a.users, icon: Users },
    { id: "signups" as const, label: a.signups, icon: UserPlus },
    { id: "analytics" as const, label: a.analytics, icon: Eye },
    { id: "revenue" as const, label: a.revenue, icon: DollarSign },
  ];

  const card = "rounded-2xl border border-gray-200 bg-white shadow-sm";
  const statTints: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-600",
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-[#0f172a] hover:border-gray-300 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <ZinvestLogo textClassName="text-[18px]" />
                <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ backgroundColor: "#eef1ff", color: BRAND }}>Admin</span>
              </div>
              <p className="text-[13px] text-gray-500 mt-1">{a.welcomeBack.replace("{name}", user.name)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-600">{a.live}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ backgroundColor: "#eef1ff", borderColor: "#c7d2fe" }}>
              <Crown className="h-4 w-4" style={{ color: BRAND }} />
              <span className="text-sm font-semibold" style={{ color: BRAND }}>{a.superAdmin}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-white border border-gray-200 w-fit overflow-x-auto shadow-sm">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                style={active ? { backgroundColor: "#eef1ff", color: BRAND } : { color: "#6b7280" }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.id === "signups" && signups.length > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full text-[10px] font-bold text-white px-1.5" style={{ backgroundColor: BRAND }}>
                    {signups.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: a.totalUsers, value: users.length, icon: Users, color: "blue", sub: a.thisWeek.replace("{n}", String(analytics.thisWeekSignups)) },
                { label: a.totalVisits, value: analytics.totalVisits, icon: Globe, color: "green", sub: a.today.replace("{n}", String(analytics.todayVisits)) },
                { label: a.totalSignups, value: analytics.totalSignups, icon: UserPlus, color: "purple", sub: a.today.replace("{n}", String(analytics.todaySignups)) },
                { label: a.pageViews, value: analytics.totalPageViews, icon: Eye, color: "yellow", sub: a.uniqueSessions.replace("{n}", String(analytics.uniqueSessions)) },
              ].map((stat, i) => (
                <div key={i} className={`${card} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{stat.label}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${statTints[stat.color]}`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#0f172a] mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Signups */}
              <div className={`${card} p-6`}>
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5" style={{ color: BRAND }} />
                  {a.latestSignups}
                  <span className="text-xs text-gray-400 font-normal">{a.autoRefreshes}</span>
                </h3>
                <div className="space-y-1">
                  {signups.slice(0, 6).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, #5b73ff)` }}>
                          {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{s.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{formatTimeAgo(s.timestamp)}</span>
                    </div>
                  ))}
                  {signups.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{a.noSignupsYet}</p>}
                </div>
              </div>

              {/* Registered Users */}
              <div className={`${card} p-6`}>
                <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  {a.registeredUsers}
                </h3>
                <div className="space-y-1">
                  {users.slice(0, 6).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white">
                          {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                        {u.isAdmin && <span className="block text-[10px] font-medium" style={{ color: BRAND }}>{a.roleAdmin}</span>}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{a.noUsersYet}</p>}
                </div>
              </div>
            </div>

            {/* Visit Trend */}
            <div className={`mt-6 ${card} p-6`}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                {a.visitsSignups14}
              </h3>
              <div className="flex items-end gap-1 h-32">
                {analytics.visitsByDay.map((day, i) => {
                  const maxVisits = Math.max(...analytics.visitsByDay.map(d => d.count), 1);
                  const height = (day.count / maxVisits) * 100;
                  const signupDay = analytics.signupsByDay[i];
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0f172a] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {a.chartTooltipVisits.replace("{date}", day.date.slice(5)).replace("{visits}", String(day.count)).replace("{signups}", String(signupDay?.count || 0))}
                      </div>
                      <div className="w-full flex-1 flex items-end">
                        <div className="w-full rounded-t bg-blue-500/70 transition-all group-hover:bg-blue-600" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400 rotate-45 origin-left mt-1">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={a.searchUsersPlaceholder}
                className="w-full rounded-xl border-2 border-gray-200 focus:border-[#2345FF] bg-white pl-10 pr-4 py-3 text-sm text-[#0f172a] placeholder-gray-300 outline-none transition-all"
              />
            </div>
            <div className={`${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[a.colUser, a.colEmail, a.colJoined, a.colLastActive, a.colRole, a.colStatus].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const activity = analytics.userActivityByUserId[u.id];
                      const isActive = activity?.lastActiveAt ? Date.now() - new Date(activity.lastActiveAt).getTime() < 24 * 60 * 60 * 1000 : false;
                      return (
                        <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, #5b73ff)` }}>
                                {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                              <span className="text-sm font-medium text-[#0f172a]">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td className="px-6 py-4">
                            {activity?.lastActiveAt ? (
                              <div>
                                <p className="text-sm text-gray-700">{formatTimeAgo(activity.lastActiveAt)}</p>
                                {activity.lastPage && <p className="text-xs text-gray-400 truncate max-w-[160px]">{activity.lastPage}</p>}
                              </div>
                            ) : <span className="text-xs text-gray-400">{a.none}</span>}
                          </td>
                          <td className="px-6 py-4">
                            {u.isAdmin ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border" style={{ backgroundColor: "#eef1ff", borderColor: "#c7d2fe", color: BRAND }}>
                                <Shield className="h-3 w-3" />{a.roleAdmin}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500">
                                <Users className="h-3 w-3" />{a.roleUser}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{a.statusActive}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />{a.statusInactive}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">{a.noUsersFound}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">{a.showingUsers.replace("{shown}", String(filteredUsers.length)).replace("{total}", String(users.length))}</p>
          </motion.div>
        )}

        {/* Signups */}
        {activeTab === "signups" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#0f172a] flex items-center gap-2">
                <Bell className="h-5 w-5" style={{ color: BRAND }} />
                {a.allSignups}
                <span className="text-sm font-normal text-gray-400">{a.instantReg}</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: a.todayLabel, value: analytics.todaySignups },
                { label: a.thisWeekLabel, value: analytics.thisWeekSignups },
                { label: a.thisMonthLabel, value: analytics.thisMonthSignups },
              ].map((s) => (
                <div key={s.label} className={`${card} p-5`}>
                  <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                  <p className="text-3xl font-bold text-[#0f172a]">{s.value}</p>
                </div>
              ))}
            </div>
            <div className={`${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {[a.colPerson, a.colEmail, a.colSignedUp, a.colTimeAgo].map((h) => (
                        <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                              {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-[#0f172a]">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm" style={{ color: BRAND }}>{s.email}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(s.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="px-6 py-4"><span className="text-xs text-gray-400 flex items-center gap-1"><Clock className="h-3 w-3" />{formatTimeAgo(s.timestamp)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {signups.length === 0 && (
                <div className="py-12 text-center">
                  <UserPlus className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">{a.noSignupsRecorded}</p>
                  <p className="text-xs text-gray-300 mt-1">{a.signupsAppearHere}</p>
                </div>
              )}
            </div>
            <div className={`mt-6 ${card} p-6`}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4">{a.signupsPerDay}</h3>
              <div className="flex items-end gap-1.5 h-28">
                {analytics.signupsByDay.map((day) => {
                  const max = Math.max(...analytics.signupsByDay.map(d => d.count), 1);
                  const height = (day.count / max) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0f172a] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date.slice(5)}: {day.count}
                      </div>
                      <div className="w-full flex items-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t bg-purple-500/70 transition-all group-hover:bg-purple-600" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: a.totalVisits, value: analytics.totalVisits, sub: a.today.replace("{n}", String(analytics.todayVisits)) },
                { label: a.uniqueSessionsLabel, value: analytics.uniqueSessions, sub: a.basedOnSessionIds },
                { label: a.pageViews, value: analytics.totalPageViews, sub: a.mostPopular.replace("{page}", analytics.topPages[0]?.page || a.none) },
                { label: a.thisWeekVisits, value: analytics.thisWeekVisits, sub: a.thisMonthVisits.replace("{n}", String(analytics.thisMonthVisits)) },
              ].map((stat, i) => (
                <div key={i} className={`${card} p-5`}>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#0f172a] mb-1">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className={`${card} p-6 mb-6`}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" style={{ color: BRAND }} />{a.topPages}
              </h3>
              <div className="space-y-3">
                {analytics.topPages.length > 0 ? analytics.topPages.map((page, i) => {
                  const maxCount = analytics.topPages[0]?.count || 1;
                  const width = (page.count / maxCount) * 100;
                  return (
                    <div key={page.page} className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#0f172a] font-medium">{page.page}</span>
                          <span className="text-xs text-gray-400">{page.count} {a.views}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100">
                          <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: BRAND }} />
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-gray-400 text-center py-4">{a.noPageViews}</p>}
              </div>
            </div>
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4">{a.visitsPerDay}</h3>
              <div className="flex items-end gap-1.5 h-28">
                {analytics.visitsByDay.map((day) => {
                  const max = Math.max(...analytics.visitsByDay.map(d => d.count), 1);
                  const height = (day.count / max) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0f172a] rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date.slice(5)}: {day.count}
                      </div>
                      <div className="w-full flex items-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t bg-emerald-500/70 transition-all group-hover:bg-emerald-600" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-400">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Revenue */}
        {activeTab === "revenue" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: a.monthlyPlan, subscribers: revenueStats.monthlySubscribers, price: "$14.99/mo", revenue: (revenueStats.monthlySubscribers * 14.99).toFixed(2), color: "text-blue-600" },
                { label: a.semiAnnualPlan, subscribers: revenueStats.semiAnnualSubscribers, price: "$10.00/mo", revenue: (revenueStats.semiAnnualSubscribers * 10).toFixed(2), color: "text-purple-600" },
                { label: a.annualPlan, subscribers: revenueStats.annualSubscribers, price: "$7.50/mo", revenue: (revenueStats.annualSubscribers * 7.5).toFixed(2), color: "text-emerald-600" },
              ].map((plan, i) => (
                <div key={i} className={`${card} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-semibold ${plan.color}`}>{plan.label}</span>
                    <span className="text-xs text-gray-400">{plan.price}</span>
                  </div>
                  <p className="text-3xl font-bold text-[#0f172a] mb-1">{plan.subscribers}</p>
                  <p className="text-xs text-gray-400">{a.subscribers}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500">{a.revenueCol}{" "}<span className="text-[#0f172a] font-medium">${plan.revenue}</span>{a.perMonth}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={`${card} p-6`}>
              <h3 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />{a.revenueSummary}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: a.totalMRR, value: `$${revenueStats.mrr}` },
                  { label: a.estimatedARR, value: `$${(parseFloat(revenueStats.mrr) * 12).toFixed(2)}` },
                  { label: a.totalPremiumUsers, value: String(revenueStats.premiumUsers) },
                  { label: a.conversionRate, value: `${revenueStats.conversionRate}%` },
                ].map((m) => (
                  <div key={m.label}>
                    <p className="text-sm text-gray-500 mb-1">{m.label}</p>
                    <p className="text-4xl font-bold text-[#0f172a]">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
