"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Expand, MessageCircle, Mic, Minimize, Paperclip, Send, Zap } from "lucide-react";
import Image from "next/image";
import { stripHtml } from "@/lib/strip-html";
import { useLanguage } from "@/lib/language-context";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import { InteractiveLessonBody } from "@/components/lesson/interactive-lesson-body";
import { getFinanceStructuredLesson } from "@/lib/lesson-content/finance-fundamentals";
import { blocksToPlainText } from "@/lib/lesson-blocks";
import {
  isFinanceLessonId,
  courseLessonPath,
  courseListPath,
  FINANCE_COURSE_ID,
} from "@/lib/finance-course";
import { setLessonComplete, isLessonMarkedComplete } from "@/lib/learning-progress";
import {
  type ChatMsg,
  chatStorageKey,
  loadLessonChat,
  saveLessonChat,
  touchLessonAccess,
} from "@/lib/lesson-chat-storage";
import { cn } from "@/lib/utils";
import { useZiners, AI_QUESTION_COST } from "@/lib/ziners-context";
import { useTheme } from "@/components/theme-provider";

const COURSE_KEY = FINANCE_COURSE_ID;
const NOTES_PREFIX = "zinvest-notes-finance-fundamentals";
const AI_PANEL_WIDTH_KEY = "ai-panel-width";
const AI_PANEL_MIN_WIDTH = 320;
const AI_PANEL_MAX_WIDTH = 600;
const AI_PANEL_TABLET_WIDTH = 360;
const LESSON_MIN_WIDTH = 440;
const RESIZER_WIDTH = 6;
const DEFAULT_AI_PANEL_WIDTH = 400;

function ChatShell({
  messages,
  chatLoading,
  activeStreamingIndex,
}: {
  messages: ChatMsg[];
  chatLoading: boolean;
  activeStreamingIndex: number | null;
}) {
  return (
    <div className="space-y-3">
      {messages.map((m, idx) => (
        <div key={idx} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[90%] rounded-2xl px-3 py-2.5 text-sm",
              m.role === "user"
                ? "bg-violet-600 text-white"
                : "border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]",
            )}
          >
            {m.role === "ai" ? (
              <div className="prose prose-sm max-w-none break-words prose-p:my-1.5 prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--accent)] prose-code:text-[var(--text-primary)]">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                {chatLoading && idx === activeStreamingIndex ? (
                  <span className="ml-0.5 inline-block animate-pulse text-[var(--text-muted)]">▍</span>
                ) : null}
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-white">{m.content}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FinanceLessonWorkspace() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseId = typeof params?.courseId === "string" ? params.courseId : "";
  const lessonIdRaw = params?.lessonId;
  const lessonId = Number(lessonIdRaw);
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const { coins, spendCoins } = useZiners();
  const lw = t.lessonWorkspace;
  const cp = t.coursePage;
  const [insufficientCoinsWs, setInsufficientCoinsWs] = useState(false);

  const notesHtml = "";
  const [lessonSnapshot, setLessonSnapshot] = useState({ title: "", plainBody: "" });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeStreamingIndex, setActiveStreamingIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isResizableDesktop, setIsResizableDesktop] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [aiPanelWidth, setAiPanelWidth] = useState(DEFAULT_AI_PANEL_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);

  const valid = courseId === COURSE_KEY && Number.isFinite(lessonId) && isFinanceLessonId(lessonId);

  useEffect(() => {
    if (!courseId) return;
    if (courseId !== COURSE_KEY) {
      router.replace("/learn");
      return;
    }
    if (!Number.isFinite(lessonId) || !isFinanceLessonId(lessonId)) {
      router.replace(courseListPath(COURSE_KEY));
    }
  }, [courseId, lessonId, router]);

  const welcome = useMemo<ChatMsg>(
    () => ({ role: "ai", content: lw.aiWelcomeFinance }),
    [lw.aiWelcomeFinance],
  );

  const chatKey = useMemo(() => chatStorageKey(COURSE_KEY, language, lessonId), [language, lessonId]);

  useEffect(() => {
    if (!valid) return;
    touchLessonAccess(COURSE_KEY, lessonId);
  }, [valid, lessonId]);

  useEffect(() => {
    if (!valid) return;
    setChatMessages(loadLessonChat(chatKey, welcome));
  }, [chatKey, valid, welcome]);

  useEffect(() => {
    if (!valid) return;
    if (chatSaveTimer.current) clearTimeout(chatSaveTimer.current);
    chatSaveTimer.current = setTimeout(() => saveLessonChat(chatKey, chatMessages), 500);
    return () => {
      if (chatSaveTimer.current) clearTimeout(chatSaveTimer.current);
    };
  }, [chatMessages, chatKey, valid]);

  useEffect(() => {
    const el = chatListRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chatMessages, chatLoading, valid]);

  useEffect(() => {
    setIsFullscreen(searchParams.get("fullscreen") === "true");
  }, [searchParams]);

  const clampAiPanelWidth = useCallback((nextWidth: number, layoutWidth: number) => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    const maxByViewport = Math.floor(viewportWidth * 0.4);
    const maxByLayout = Math.max(AI_PANEL_MIN_WIDTH, layoutWidth - LESSON_MIN_WIDTH - RESIZER_WIDTH);
    const maxByRule = Math.min(AI_PANEL_MAX_WIDTH, maxByViewport);
    const constrainedMaxByLayout = Math.min(maxByRule, maxByLayout);
    const maxAllowed = Math.max(AI_PANEL_MIN_WIDTH, constrainedMaxByLayout);
    return Math.min(Math.max(nextWidth, AI_PANEL_MIN_WIDTH), maxAllowed);
  }, []);

  const applyPanelWidthFromX = useCallback(
    (clientX: number) => {
      const layoutEl = layoutRef.current;
      if (!layoutEl) return;
      const rect = layoutEl.getBoundingClientRect();
      const nextWidth = rect.right - clientX;
      setAiPanelWidth(clampAiPanelWidth(nextWidth, rect.width));
    },
    [clampAiPanelWidth],
  );

  const currentAiPanelWidth = useMemo(() => {
    if (isMobile) return AI_PANEL_TABLET_WIDTH;
    if (!isResizableDesktop) return AI_PANEL_TABLET_WIDTH;
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    return clampAiPanelWidth(aiPanelWidth, layoutWidth);
  }, [aiPanelWidth, clampAiPanelWidth, isMobile, isResizableDesktop]);

  const layoutGridClass = useMemo(() => {
    // In fullscreen both columns stretch and each scrolls independently (no sticky needed)
    if (isFullscreen) return "flex";
    // grid-rows-[minmax(0,1fr)] forces the single implicit row to fill the container height
    // (instead of growing to fit content), which is what makes the lesson column scroll
    // independently while the AI panel stays sticky at viewport height.
    if (isResizableDesktop)
      return "md:grid md:grid-cols-[minmax(0,1fr)_6px_var(--ai-panel-width)] md:grid-rows-[minmax(0,1fr)]";
    return "md:grid md:grid-cols-[minmax(0,1fr)_360px] md:grid-rows-[minmax(0,1fr)]";
  }, [isFullscreen, isResizableDesktop]);

  useEffect(() => {
    if (isMobile || !isResizableDesktop) return;
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    setAiPanelWidth((prev) => clampAiPanelWidth(prev, layoutWidth));
  }, [clampAiPanelWidth, isMobile, isResizableDesktop]);

  useEffect(() => {
    if (isMobile || !isResizableDesktop) return;
    try {
      localStorage.setItem(AI_PANEL_WIDTH_KEY, String(Math.round(aiPanelWidth)));
    } catch {
      // ignore storage write failures
    }
  }, [aiPanelWidth, isMobile, isResizableDesktop]);

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const resizableDesktop = width >= 1024;
      setIsMobile(mobile);
      setIsResizableDesktop(resizableDesktop);
      const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? width;
      setAiPanelWidth((prev) => clampAiPanelWidth(prev, layoutWidth));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampAiPanelWidth]);

  useEffect(() => {
    if (!isResizableDesktop) return;
    try {
      const raw = localStorage.getItem(AI_PANEL_WIDTH_KEY);
      if (!raw) return;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return;
      const layoutWidth = layoutRef.current?.getBoundingClientRect().width ?? window.innerWidth;
      setAiPanelWidth(clampAiPanelWidth(parsed, layoutWidth));
    } catch {
      // ignore storage read failures
    }
  }, [clampAiPanelWidth, isResizableDesktop]);

  useEffect(() => {
    if (!isResizing) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMouseMove = (e: MouseEvent) => applyPanelWidthFromX(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (!e.touches[0]) return;
      applyPanelWidthFromX(e.touches[0].clientX);
    };
    const stopResize = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopResize);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", stopResize);
    window.addEventListener("touchcancel", stopResize);

    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopResize);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopResize);
      window.removeEventListener("touchcancel", stopResize);
    };
  }, [applyPanelWidthFromX, isResizing]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        const paramsCopy = new URLSearchParams(searchParams.toString());
        paramsCopy.delete("fullscreen");
        const qs = paramsCopy.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        setMobileChatOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, pathname, router, searchParams]);

  const structuredBase = useMemo(
    () => (valid ? getFinanceStructuredLesson(lessonId, language) : getFinanceStructuredLesson(1, language)),
    [lessonId, language, valid],
  );

  const selectedLesson = useMemo(() => {
    if (!valid) return { id: 1, title: "", duration: "" };
    return {
      id: lessonId,
      title: getFinanceStructuredLesson(lessonId, language).title,
      duration: lessonId === 1 ? "~45 min" : "~50 min",
    };
  }, [valid, lessonId, language]);

  useEffect(() => {
    if (!valid) return;
    setLessonSnapshot({
      title: structuredBase.title,
      plainBody: blocksToPlainText(structuredBase),
    });
  }, [structuredBase, valid]);

  useEffect(() => {
    if (valid) setCompleted(isLessonMarkedComplete(COURSE_KEY, lessonId));
  }, [valid, lessonId, language]);

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const sendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    if (!spendCoins(AI_QUESTION_COST)) {
      setInsufficientCoinsWs(true);
      setTimeout(() => setInsufficientCoinsWs(false), 3000);
      return;
    }
    setInsufficientCoinsWs(false);
    const userMessage: ChatMsg = { role: "user", content: trimmed };
    const nextMessages = [...chatMessages, userMessage];
    const withAssistantPlaceholder: ChatMsg[] = [...nextMessages, { role: "ai", content: "" }];
    setChatMessages(withAssistantPlaceholder);
    setActiveStreamingIndex(withAssistantPlaceholder.length - 1);
    setChatInput("");
    setChatLoading(true);
    const scrollToBottom = () => {
      const el = chatListRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    };
    const notesSnippet = stripHtml(notesHtml).slice(0, 4000);
    const lessonTitle = lessonSnapshot.title || selectedLesson.title;
    const lessonBody = lessonSnapshot.plainBody || "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          mode: "finance",
          language,
          unit: {
            title: t.unitMeta.financeFundamentals,
            focus: `${lessonTitle}\n\n${notesSnippet ? `Learner notes: ${notesSnippet}` : ""}`,
            courseKey: COURSE_KEY,
            lessonId,
            lessonBodyText: lessonBody.slice(0, 12000),
          },
          stream: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const text = typeof (data as { text?: string })?.text === "string" && (data as { text: string }).text.trim()
          ? (data as { text: string }).text.trim()
          : lw.aiError;
        setChatMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx]?.role === "ai") next[lastIdx] = { role: "ai", content: text };
          return next;
        });
        return;
      }
      if (!res.body) {
        setChatMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx]?.role === "ai") next[lastIdx] = { role: "ai", content: lw.aiError };
          return next;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      await wait(200 + Math.floor(Math.random() * 201));
      let fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const ch of Array.from(chunk)) {
          fullText += ch;
          setChatMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx]?.role === "ai")
              next[lastIdx] = { role: "ai", content: fullText };
            return next;
          });
          scrollToBottom();
          await wait(12 + Math.floor(Math.random() * 10));
        }
      }
      if (!fullText.trim()) {
        setChatMessages((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx]?.role === "ai") next[lastIdx] = { role: "ai", content: lw.aiError };
          return next;
        });
      }
    } catch {
      setChatMessages((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (lastIdx >= 0 && next[lastIdx]?.role === "ai") next[lastIdx] = { role: "ai", content: lw.aiConnectionError };
        return next;
      });
    } finally {
      setChatLoading(false);
      setActiveStreamingIndex(null);
    }
  };

  const markComplete = (done: boolean) => {
    setLessonComplete(COURSE_KEY, lessonId, done);
    setCompleted(done);
  };

  const setFullscreenMode = (next: boolean) => {
    const paramsCopy = new URLSearchParams(searchParams.toString());
    if (next) paramsCopy.set("fullscreen", "true");
    else paramsCopy.delete("fullscreen");
    const qs = paramsCopy.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggleFullscreen = () => {
    const next = !isFullscreen;
    setFullscreenMode(next);
    if (!next) setMobileChatOpen(false);
  };

  const backHref = courseListPath(COURSE_KEY);
  const financeKeyIdea = lw.courseCopy.financeFundamentals;
  const lessonMetaLine = lw.lessonMeta
    .replace("{duration}", selectedLesson.duration)
    .replace("{id}", String(lessonId));

  const onSnapshot = useCallback((s: { title: string; plainBody: string }) => {
    setLessonSnapshot(s);
  }, []);

  const startResize = (clientX: number) => {
    if (isMobile || isFullscreen || !isResizableDesktop) return;
    setIsResizing(true);
    applyPanelWidthFromX(clientX);
  };

  if (!valid) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    );
  }

  const canOpenLesson2 = isLessonMarkedComplete(COURSE_KEY, 1);

  const editorScroll = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mx-auto w-full max-w-none px-6 py-6 md:px-10 md:py-8">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">{lessonMetaLine}</p>
        <div className="mt-4 border-b border-[var(--border)] pb-6">
          <InteractiveLessonBody
            courseKey={COURSE_KEY}
            lessonId={lessonId}
            language={language}
            base={structuredBase}
            focusReading={false}
            editHint={lw.editLessonHint}
            saveStatusSaving={lw.lessonSaving}
            saveStatusSaved={lw.lessonSaved}
            lessonBodyPlaceholder={lw.lessonBodyPlaceholder}
            onSnapshot={onSnapshot}
            showTopFormatToolbar
            tiptapToolbarClassName="border-[var(--border)] bg-[var(--bg-secondary)]/95 backdrop-blur-sm dark:bg-zinc-900/90"
          />
        </div>
        <div className="mt-6 rounded-2xl border border-blue-500/25 bg-blue-500/[0.06] p-4 dark:bg-blue-500/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200/90">{lw.keyIdea}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            <mark className="rounded bg-blue-500/20 px-1 text-[var(--text-primary)] dark:bg-blue-500/30 dark:text-zinc-100">
              {financeKeyIdea.keyIdeaHighlight}
            </mark>
            {financeKeyIdea.keyIdeaRest}
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => markComplete(!completed)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              completed
                ? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : "border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]",
            )}
          >
            {completed ? lw.completed : lw.markComplete}
          </button>
          <Link
            href="/learn/finance-fundamentals/test"
            className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
          >
            {lw.finishUnit}
          </Link>
          {lessonId === 1 ? (
            <Link
              href={courseLessonPath(COURSE_KEY, 2)}
              className={cn(
                "inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors",
                canOpenLesson2 ? "hover:bg-[var(--bg-tertiary)]" : "pointer-events-none opacity-40",
              )}
            >
              {lw.nextLesson}
            </Link>
          ) : (
            <Link
              href={courseLessonPath(COURSE_KEY, 1)}
              className="inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)]"
            >
              {t.trackPage.backToCourses} · {lw.tabLesson} 1
            </Link>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AuthGate>
      {/* h-dvh + overflow-hidden anchors the entire workspace to exactly one viewport height,
          so the inner grid gets a bounded height and the lesson column can scroll independently */}
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {!isFullscreen && <Navigation />}

        {/* Remove the duplicate min-h-dvh that was causing this container to grow with content */}
        <div className={cn("flex flex-1 flex-col overflow-hidden", isFullscreen ? "pt-0" : "pt-20 md:pt-24")}>
          {!isFullscreen && (
            <div className="shrink-0 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg-primary)_92%,transparent)] px-4 py-3 backdrop-blur-md">
              <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {cp.backToCourseNamed.replace("{courseName}", t.trackPage.financeFundamentals)}
                </Link>
                <div className="text-xs text-[var(--text-muted)]">
                  {lessonMetaLine} · {lw.columnLesson}
                </div>
              </div>
            </div>
          )}

          <div
            ref={layoutRef}
            className={cn("mx-auto w-full max-w-[1600px] min-h-0 flex-1 overflow-hidden", layoutGridClass)}
            style={
              isFullscreen
                ? undefined
                : ({
                    "--ai-panel-width": `${currentAiPanelWidth}px`,
                  } as CSSProperties)
            }
          >
            {/* h-full + overflow-y-auto: column fills the bounded row/flex height and scrolls
                independently in both normal and fullscreen modes */}
            <div className={cn("min-w-0 min-h-0 h-full overflow-y-auto", isFullscreen && "flex-1")}>{editorScroll}</div>
            {!isFullscreen && isResizableDesktop && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize AI panel"
                onMouseDown={(e) => startResize(e.clientX)}
                onTouchStart={(e) => {
                  if (!e.touches[0]) return;
                  startResize(e.touches[0].clientX);
                }}
                className={cn(
                  "group relative hidden w-[6px] cursor-col-resize select-none touch-none lg:block",
                  isResizing ? "bg-violet-500/45" : "bg-transparent hover:bg-violet-500/25",
                )}
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--border)] transition-colors group-hover:bg-violet-500/80" />
              </div>
            )}
            <aside
              className={cn(
                // h-full fills the grid row / flex stretch height in both modes;
                // internal messages div (flex-1 overflow-y-auto) scrolls independently
                "hidden min-h-0 flex-col border-l border-[var(--border)] bg-[var(--bg-primary)] transition-all duration-200 ease-in-out md:flex",
                isFullscreen
                  ? "h-full w-[35%] min-w-[380px]"
                  : "h-full w-[var(--ai-panel-width)] min-w-[320px]",
              )}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5">
                <span className="text-[10px] text-[var(--text-muted)]">AI</span>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  title={isFullscreen ? "Exit full screen" : "Full screen"}
                >
                  {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                  {isFullscreen ? "Exit full screen" : "Full screen"}
                </button>
              </div>
              <div className="shrink-0 border-b border-[var(--border)] px-4 py-4">
                <div className="flex items-center gap-2.5">
                  <Image
                    src={theme === "dark" ? "/zinvest-icon-only.svg" : "/zinvest-logo-on-light.svg"}
                    alt="Zinvest"
                    width={28}
                    height={28}
                    className="h-7 w-7 shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">{cp.heyAi}</h2>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{cp.aiDocLine}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                    <Zap className="h-2.5 w-2.5" />
                    {coins}
                  </div>
                </div>
              </div>
              <div ref={chatListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
                <ChatShell
                  messages={chatMessages}
                  chatLoading={chatLoading}
                  activeStreamingIndex={activeStreamingIndex}
                />
              </div>
              <div className="sticky bottom-0 z-10 shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--bg-primary)] p-3">
                {insufficientCoinsWs ? (
                  <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                    Not enough Zinverts ({coins} / {AI_QUESTION_COST} needed). Keep a streak to earn more!
                  </p>
                ) : (
                  <p className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                    <Image src="/icon-192.png" alt="" width={10} height={10} className="rounded" />
                    {AI_QUESTION_COST} Zinverts per question · {coins} available
                  </p>
                )}
                <div className="flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder={cp.chatPlaceholder}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={chatLoading}
                    className="shrink-0 rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-500 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    title="Microphone (soon)"
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    title="Attach (soon)"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {isMobile && !mobileChatOpen && !isFullscreen && (
          <button
            type="button"
            onClick={() => {
              setMobileChatOpen(true);
              setFullscreenMode(true);
            }}
            className="fixed bottom-6 right-6 z-[120] flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-500/30 transition-colors hover:bg-violet-500 md:hidden"
            title="Open AI chat"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        )}

        {isMobile && (mobileChatOpen || isFullscreen) && (
          <div className="fixed inset-0 z-[130] flex flex-col bg-[var(--bg-primary)] md:hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">AI</span>
              <button
                type="button"
                onClick={() => {
                  setMobileChatOpen(false);
                  setFullscreenMode(false);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)]"
              >
                <Minimize className="h-3.5 w-3.5" />
                Exit
              </button>
            </div>
            <div className="shrink-0 border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src={theme === "dark" ? "/zinvest-icon-only.svg" : "/zinvest-logo-on-light.svg"}
                  alt="Zinvest"
                  width={28}
                  height={28}
                  className="h-7 w-7 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">{cp.heyAi}</h2>
                  <p className="text-xs text-[var(--text-muted)]">{cp.aiDocLine}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
                  <Zap className="h-2.5 w-2.5" />
                  {coins}
                </div>
              </div>
            </div>
            <div ref={chatListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
              <ChatShell
                messages={chatMessages}
                chatLoading={chatLoading}
                activeStreamingIndex={activeStreamingIndex}
              />
            </div>
            <div className="shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--bg-primary)] p-3">
              {insufficientCoinsWs ? (
                <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                  Not enough Zinverts ({coins} / {AI_QUESTION_COST} needed). Keep a streak to earn more!
                </p>
              ) : (
                <p className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                  <Image src="/icon-192.png" alt="" width={10} height={10} className="rounded" />
                  {AI_QUESTION_COST} Zinverts per question · {coins} available
                </p>
              )}
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder={cp.chatPlaceholder}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-500/50"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={chatLoading}
                  className="shrink-0 rounded-xl bg-violet-600 p-2.5 text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  title="Microphone (soon)"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  title="Attach (soon)"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
