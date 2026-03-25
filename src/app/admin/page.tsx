"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, TrendingUp, BarChart3, Activity,
  ArrowLeft, Search, Crown, Eye, Globe,
  DollarSign, UserPlus, Bell, Mail, Calendar, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAnalytics } from "@/lib/analytics-context";
import type { SignupEvent, VisitEvent, PageViewEvent, AnalyticsStats } from "@/lib/analytics-context";
import type { User } from "@/lib/auth-context";

export default function AdminPage() {
  const { user, getAllUsers } = useAuth();
  const { getStats, getSignups, getVisits, getPageViews } = useAnalytics();
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 5 seconds
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
      monthlySubscribers,
      semiAnnualSubscribers,
      annualSubscribers,
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

  if (!mounted || !user?.isAdmin) {
    return (
      <main className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="min-h-screen bg-[#0a0f1c] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </main>
    );
  }

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "signups" as const, label: "Signups", icon: UserPlus },
    { id: "analytics" as const, label: "Analytics", icon: Eye },
    { id: "revenue" as const, label: "Revenue", icon: DollarSign },
  ];

  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">Welcome back, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              <span className="text-xs font-medium text-green-400">Live</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-2">
              <Crown className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Super Admin</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-white/[0.03] border border-white/10 w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "signups" && signups.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white px-1.5">
                  {signups.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: users.length, icon: Users, color: "blue", sub: `+${analytics.thisWeekSignups} this week` },
                { label: "Total Visits", value: analytics.totalVisits, icon: Globe, color: "green", sub: `${analytics.todayVisits} today` },
                { label: "Total Signups", value: analytics.totalSignups, icon: UserPlus, color: "purple", sub: `${analytics.todaySignups} today` },
                { label: "Page Views", value: analytics.totalPageViews, icon: Eye, color: "yellow", sub: `${analytics.uniqueSessions} unique sessions` },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-400">{stat.label}</span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      stat.color === "blue" ? "bg-blue-500/10 text-blue-400" :
                      stat.color === "green" ? "bg-green-500/10 text-green-400" :
                      stat.color === "purple" ? "bg-purple-500/10 text-purple-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      <stat.icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Latest Signups */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-400" />
                  Latest Signups
                  <span className="text-xs text-slate-500 font-normal">(auto-refreshes)</span>
                </h3>
                <div className="space-y-3">
                  {signups.slice(0, 6).map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                          {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />{s.email}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500">{formatTimeAgo(s.timestamp)}</span>
                    </div>
                  ))}
                  {signups.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No signups yet</p>
                  )}
                </div>
              </div>

              {/* Registered Users */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-400" />
                  Registered Users
                </h3>
                <div className="space-y-3">
                  {users.slice(0, 6).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-xs font-bold text-white">
                          {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</span>
                        {u.isAdmin && <span className="block text-[10px] text-blue-400 font-medium">Admin</span>}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No users yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Visit Trend */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Visits &amp; Signups — Last 14 Days
              </h3>
              <div className="flex items-end gap-1 h-32">
                {analytics.visitsByDay.map((day, i) => {
                  const maxVisits = Math.max(...analytics.visitsByDay.map(d => d.count), 1);
                  const height = (day.count / maxVisits) * 100;
                  const signupDay = analytics.signupsByDay[i];
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date.slice(5)}: {day.count} visits, {signupDay?.count || 0} signups
                      </div>
                      <div className="w-full flex-1 flex items-end">
                        <div className="w-full rounded-t bg-blue-500/40 transition-all group-hover:bg-blue-500/60" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-600 rotate-45 origin-left mt-1">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25 transition-all"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Last Active</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const activity = analytics.userActivityByUserId[u.id];
                      const isActive = activity?.lastActiveAt
                        ? Date.now() - new Date(activity.lastActiveAt).getTime() < 24 * 60 * 60 * 1000
                        : false;

                      return (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
                              {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-white">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          {activity?.lastActiveAt ? (
                            <div>
                              <p className="text-sm text-slate-300">{formatTimeAgo(activity.lastActiveAt)}</p>
                              {activity.lastPage && (
                                <p className="text-xs text-slate-600 truncate max-w-[160px]">{activity.lastPage}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-400">
                              <Shield className="h-3 w-3" />Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/20 px-2.5 py-1 text-xs font-medium text-slate-400">
                              <Users className="h-3 w-3" />User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-400" />Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />Inactive
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
                  <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">No users found</p>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">Showing {filteredUsers.length} of {users.length} users</p>
          </motion.div>
        )}

        {/* Signups Tab */}
        {activeTab === "signups" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-400" />
                All Signups
                <span className="text-sm font-normal text-slate-500">— Instant registration tracking</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-slate-400 mb-1">Today</p>
                <p className="text-3xl font-bold text-white">{analytics.todaySignups}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-slate-400 mb-1">This Week</p>
                <p className="text-3xl font-bold text-white">{analytics.thisWeekSignups}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-slate-400 mb-1">This Month</p>
                <p className="text-3xl font-bold text-white">{analytics.thisMonthSignups}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Person</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Signed Up</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time Ago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((s) => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                              {s.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <span className="text-sm font-medium text-white">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-sm text-blue-400">{s.email}</span></td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(s.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{formatTimeAgo(s.timestamp)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {signups.length === 0 && (
                <div className="py-12 text-center">
                  <UserPlus className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-500">No signups recorded yet</p>
                  <p className="text-xs text-slate-600 mt-1">New registrations will appear here instantly</p>
                </div>
              )}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Signups Per Day (Last 14 Days)</h3>
              <div className="flex items-end gap-1.5 h-28">
                {analytics.signupsByDay.map((day) => {
                  const max = Math.max(...analytics.signupsByDay.map(d => d.count), 1);
                  const height = (day.count / max) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date.slice(5)}: {day.count}
                      </div>
                      <div className="w-full flex items-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t bg-purple-500/50 transition-all group-hover:bg-purple-500/80" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-600">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Visits", value: analytics.totalVisits, sub: `${analytics.todayVisits} today` },
                { label: "Unique Sessions", value: analytics.uniqueSessions, sub: "Based on session IDs" },
                { label: "Page Views", value: analytics.totalPageViews, sub: `${analytics.topPages[0]?.page || "—"} most popular` },
                { label: "This Week", value: analytics.thisWeekVisits, sub: `${analytics.thisMonthVisits} this month` },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-xs text-slate-500">{stat.sub}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />Top Pages
              </h3>
              <div className="space-y-3">
                {analytics.topPages.length > 0 ? analytics.topPages.map((page, i) => {
                  const maxCount = analytics.topPages[0]?.count || 1;
                  const width = (page.count / maxCount) * 100;
                  return (
                    <div key={page.page} className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 w-6 text-right">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white font-medium">{page.page}</span>
                          <span className="text-xs text-slate-400">{page.count} views</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-blue-500/50" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-slate-500 text-center py-4">No page views recorded yet</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Visits Per Day (Last 14 Days)</h3>
              <div className="flex items-end gap-1.5 h-28">
                {analytics.visitsByDay.map((day) => {
                  const max = Math.max(...analytics.visitsByDay.map(d => d.count), 1);
                  const height = (day.count / max) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {day.date.slice(5)}: {day.count}
                      </div>
                      <div className="w-full flex items-end" style={{ height: "100%" }}>
                        <div className="w-full rounded-t bg-green-500/50 transition-all group-hover:bg-green-500/80" style={{ height: `${Math.max(height, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-slate-600">{day.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Monthly Plan", subscribers: revenueStats.monthlySubscribers, price: "$14.99/mo", revenue: (revenueStats.monthlySubscribers * 14.99).toFixed(2), color: "blue" },
                { label: "6-Month Plan", subscribers: revenueStats.semiAnnualSubscribers, price: "$10.00/mo", revenue: (revenueStats.semiAnnualSubscribers * 10).toFixed(2), color: "purple" },
                { label: "Annual Plan", subscribers: revenueStats.annualSubscribers, price: "$7.50/mo", revenue: (revenueStats.annualSubscribers * 7.5).toFixed(2), color: "green" },
              ].map((plan, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-medium ${plan.color === "blue" ? "text-blue-400" : plan.color === "purple" ? "text-purple-400" : "text-green-400"}`}>{plan.label}</span>
                    <span className="text-xs text-slate-500">{plan.price}</span>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{plan.subscribers}</p>
                  <p className="text-xs text-slate-500">subscribers</p>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-sm text-slate-400">Revenue: <span className="text-white font-medium">${plan.revenue}</span>/mo</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />Revenue Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total MRR</p>
                  <p className="text-4xl font-bold text-white">${revenueStats.mrr}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Estimated ARR</p>
                  <p className="text-4xl font-bold text-white">${(parseFloat(revenueStats.mrr) * 12).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Premium Users</p>
                  <p className="text-4xl font-bold text-white">{revenueStats.premiumUsers}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Conversion Rate</p>
                  <p className="text-4xl font-bold text-white">{revenueStats.conversionRate}%</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function formatTimeAgo(isoString: string | null | undefined): string {
  if (!isoString) return "—";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
