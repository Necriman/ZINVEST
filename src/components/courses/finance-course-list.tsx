"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Lock,
  MoreVertical,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { courseLessonPath, courseListPath, FINANCE_COURSE_ID, FINANCE_LESSON_IDS } from "@/lib/finance-course";
import { isLessonMarkedComplete, setLessonComplete } from "@/lib/learning-progress";
import { getFinanceStructuredLesson } from "@/lib/lesson-content/finance-fundamentals";
import { getLessonAccessAt, touchLessonAccess } from "@/lib/lesson-chat-storage";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const ICON_COLORS = [
  "bg-violet-500/20 text-violet-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-sky-500/20 text-sky-300",
  "bg-amber-500/20 text-amber-300",
];

type LessonRow = { id: number; title: string; duration: string };

function formatAccess(
  t: { coursePage: { lastOpenedHours: string; lastOpenedDays: string; neverOpened: string } },
  at: number | null,
) {
  if (at == null) return t.coursePage.neverOpened;
  const diff = Date.now() - at;
  const h = diff / 3600000;
  if (h < 24) return t.coursePage.lastOpenedHours.replace("{n}", "1");
  if (h < 72) return t.coursePage.lastOpenedHours.replace("{n}", String(Math.max(1, Math.round(h / 24))));
  const d = Math.round(h / 24);
  return t.coursePage.lastOpenedDays.replace("{n}", String(Math.max(1, d)));
}

function lessonRowMeta(
  done: boolean,
  duration: string,
  cp: { metaComplete: string; metaOpen: string },
) {
  return done ? cp.metaComplete.replace("{duration}", duration) : cp.metaOpen.replace("{duration}", duration);
}

function groupForLesson(at: number | null): "today" | "week" | "earlier" {
  if (at == null) return "today";
  const days = (Date.now() - at) / 86400000;
  if (days < 1) return "today";
  if (days < 7) return "week";
  return "earlier";
}

export function FinanceCourseList() {
  const { t, language } = useLanguage();
  const cp = t.coursePage;
  const courseId = FINANCE_COURSE_ID;
  const [tab, setTab] = useState<"my" | "shared">("my");
  const [version, setVersion] = useState(0);

  const lessonRows: LessonRow[] = useMemo(
    () =>
      FINANCE_LESSON_IDS.map((id) => ({
        id,
        title: getFinanceStructuredLesson(id, language).title,
        duration: id === 1 ? "~45 min" : id === 2 ? "~50 min" : id === 3 ? "~40 min" : "~45 min",
      })),
    [language],
  );

  const completedById = useMemo(() => {
    const next: Record<number, boolean> = {};
    for (const l of lessonRows) {
      next[l.id] = isLessonMarkedComplete(courseId, l.id);
    }
    return next;
  }, [lessonRows, version, courseId]);

  const accessAt = (id: number) => getLessonAccessAt(courseId, id);
  const locked = (idx: number) => {
    if (idx === 0) return false;
    const prev = lessonRows[idx - 1]?.id;
    return prev ? !completedById[prev] : false;
  };

  const completedCount = lessonRows.filter((l) => completedById[l.id]).length;
  const progress = lessonRows.length ? Math.round((completedCount / lessonRows.length) * 100) : 0;

  const grouped = useMemo(() => {
    const buckets: { today: LessonRow[]; week: LessonRow[]; earlier: LessonRow[] } = {
      today: [],
      week: [],
      earlier: [],
    };
    lessonRows.forEach((row, idx) => {
      if (locked(idx)) {
        buckets.earlier.push(row);
        return;
      }
      const g = groupForLesson(accessAt(row.id));
      buckets[g].push(row);
    });
    return buckets;
  }, [lessonRows, version, language]);

  const openLesson = (id: number) => {
    touchLessonAccess(courseId, id);
  };

  return (
    <div className="text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-8 md:px-6 md:pt-10 lg:px-8">
        <Link
          href="/learn"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          ← {t.trackPage.backToCourses}
        </Link>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
              <DollarSign className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                {t.trackPage.financeFundamentals}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)] md:text-base">{t.trackPage.financeFundamentalsDesc}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {lessonRows.length} {t.trackPage.lessonsCount}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4" />2 {t.trackPage.hoursTotal}
            </span>
          </div>
          <div className="mt-6 max-w-2xl">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>{t.trackPage.yourProgress}</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {completedCount}/{lessonRows.length} {t.trackPage.completed}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--progress-track)]">
              <motion.div
                key={progress}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
            <button
              type="button"
              onClick={() => setTab("my")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === "my"
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {cp.myLessons}
            </button>
            <button
              type="button"
              onClick={() => setTab("shared")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                tab === "shared"
                  ? "bg-[var(--text-primary)] text-[var(--bg-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              {cp.shared}
            </button>
          </div>
          <button
            type="button"
            onClick={() => toast.info(cp.newLessonSoon)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            {cp.newLesson}
          </button>
        </div>

        {tab === "shared" ? (
          <p className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-muted)]">
            {cp.newLessonSoon}
          </p>
        ) : (
          <div className="space-y-8">
            {(
              [
                ["today", cp.groupToday, grouped.today] as const,
                ["week", cp.groupWeek, grouped.week] as const,
                ["earlier", cp.groupEarlier, grouped.earlier] as const,
              ] as const
            ).map(([key, label, items]) =>
              items.length ? (
                <section key={key}>
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">{label}</h2>
                  <ul className="space-y-2">
                    {items.map((lesson, i) => {
                      const idx = lessonRows.findIndex((x) => x.id === lesson.id);
                      const isLocked = idx >= 0 && locked(idx);
                      const done = completedById[lesson.id] ?? false;
                      const at = accessAt(lesson.id);
                      const sub = isLocked
                        ? cp.locked
                        : `${lessonRowMeta(done, lesson.duration, cp)} · ${formatAccess(t, at)}`;
                      const color = ICON_COLORS[lesson.id % ICON_COLORS.length]!;
                      return (
                        <li key={lesson.id}>
                          <div
                            className={cn(
                              "group flex items-stretch overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] transition-colors",
                              !isLocked && "hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]",
                              isLocked && "opacity-50",
                            )}
                          >
                            <Link
                              href={isLocked ? courseListPath(courseId) : courseLessonPath(courseId, lesson.id)}
                              onClick={() => {
                                if (!isLocked) openLesson(lesson.id);
                              }}
                              className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4"
                            >
                              <div
                                className={cn(
                                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                  isLocked ? "bg-[var(--bg-tertiary)] text-[var(--text-muted)]" : color,
                                )}
                              >
                                {isLocked ? <Lock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[var(--text-primary)]">{lesson.title}</p>
                                <p className="mt-0.5 text-xs text-[var(--text-muted)]">{sub}</p>
                              </div>
                              {!isLocked && done ? (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              ) : null}
                            </Link>
                            <div className="flex items-center pr-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-muted)] outline-none transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                                >
                                  <DropdownMenuItem
                                    className="focus:bg-[var(--bg-secondary)]"
                                    onClick={() => {
                                      const t2 = window.prompt("Title", lesson.title);
                                      if (t2 == null) return;
                                      const tr = t2.trim();
                                      if (!tr) return;
                                      const k = `zinvest-lesson-v2-${courseId}-${language}-${lesson.id}`;
                                      try {
                                        const raw = localStorage.getItem(k);
                                        const base = { title: tr, bodyHtml: "<p></p>" };
                                        if (raw) {
                                          const p = JSON.parse(raw) as { bodyHtml?: string };
                                          localStorage.setItem(
                                            k,
                                            JSON.stringify({ title: tr, bodyHtml: p.bodyHtml ?? "<p></p>" }),
                                          );
                                        } else {
                                          localStorage.setItem(k, JSON.stringify(base));
                                        }
                                        toast.success("OK");
                                        setVersion((v) => v + 1);
                                      } catch {
                                        toast.error("Failed");
                                      }
                                    }}
                                  >
                                    {cp.rename}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="focus:bg-[var(--bg-secondary)]"
                                    onClick={() => {
                                      void navigator.clipboard.writeText(
                                        `${window.location.origin}${courseLessonPath(courseId, lesson.id)}`,
                                      );
                                      toast.success(cp.linkCopied);
                                    }}
                                  >
                                    {cp.share}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="focus:bg-[var(--bg-secondary)]"
                                    onClick={() => toast.info(cp.newLessonSoon)}
                                  >
                                    {cp.duplicate}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[var(--border)]" />
                                  <DropdownMenuItem
                                    className="text-red-400 focus:bg-red-950/50"
                                    onClick={() => {
                                      if (!window.confirm(cp.deleteConfirm)) return;
                                      try {
                                        localStorage.removeItem(`zinvest-lesson-v2-${courseId}-${language}-${lesson.id}`);
                                        setLessonComplete(courseId, lesson.id, false);
                                        toast.success("OK");
                                        setVersion((v) => v + 1);
                                      } catch {
                                        toast.error("Failed");
                                      }
                                    }}
                                  >
                                    {cp.delete}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null,
            )}
          </div>
        )}
        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          <Link className="text-emerald-600 hover:underline dark:text-emerald-400/90" href="/learn/finance-fundamentals/test">
            {cp.openUnitTest}
          </Link>
        </p>
      </div>
    </div>
  );
}
