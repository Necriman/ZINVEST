"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Expand, Minimize, Mic, Paperclip, Send, StickyNote } from "lucide-react";
import { stripHtml } from "@/lib/strip-html";
import { useLanguage } from "@/lib/language-context";
import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import { InteractiveLessonBody } from "@/components/lesson/interactive-lesson-body";
import { NotionNotesEditor } from "@/components/lesson/notion-notes-editor";
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

const COURSE_KEY = FINANCE_COURSE_ID;
const NOTES_PREFIX = "zinvest-notes-finance-fundamentals";

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
  const courseId = typeof params?.courseId === "string" ? params.courseId : "";
  const lessonIdRaw = params?.lessonId;
  const lessonId = Number(lessonIdRaw);
  const { t, language } = useLanguage();
  const lw = t.lessonWorkspace;
  const cp = t.coursePage;

  const [notesHtml, setNotesHtml] = useState("");
  const [lessonSnapshot, setLessonSnapshot] = useState({ title: "", plainBody: "" });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [activeStreamingIndex, setActiveStreamingIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const chatListRef = useRef<HTMLDivElement>(null);
  const chatSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    onFsChange();
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen permission/runtime errors.
    }
  };

  const backHref = courseListPath(COURSE_KEY);
  const financeKeyIdea = lw.courseCopy.financeFundamentals;
  const lessonMetaLine = lw.lessonMeta
    .replace("{duration}", selectedLesson.duration)
    .replace("{id}", String(lessonId));

  const onSnapshot = useCallback((s: { title: string; plainBody: string }) => {
    setLessonSnapshot(s);
  }, []);

  if (!valid) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] text-sm text-[var(--text-muted)]">
        Redirecting…
      </div>
    );
  }

  const canOpenLesson2 = isLessonMarkedComplete(COURSE_KEY, 1);

  const editorScroll = (
    <div
      className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto border-r border-[var(--border)]"
    >
      <div className="w-full max-w-[1600px] px-4 py-6 md:px-6 md:py-8 lg:px-8">
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
        <div id="zinvest-lesson-notes" className="mt-8 scroll-mt-24 border-t border-[var(--border)] pt-6">
          <span className="text-xs font-semibold text-[var(--text-muted)]">{lw.yourNotes}</span>
          <NotionNotesEditor
            lessonId={lessonId}
            storageKeyPrefix={NOTES_PREFIX}
            legacyPlainStorageKeyPrefix={NOTES_PREFIX}
            placeholder={lw.notesPlaceholder}
            onHtmlChange={setNotesHtml}
          />
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
          <button
            type="button"
            onClick={() => document.getElementById("zinvest-lesson-notes")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] md:hidden"
          >
            <StickyNote className="h-4 w-4" />
            {lw.stickyJumpToNotes}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AuthGate>
      <div className="flex min-h-dvh flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navigation />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-20 md:pt-24">
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

          <div className="flex min-h-0 flex-1">
            <div className="min-h-0 min-w-0 flex-1">{editorScroll}</div>
            <aside className="hidden h-full min-h-0 w-[420px] max-w-[42vw] min-w-[340px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--bg-primary)] lg:flex">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2.5">
                <span className="text-[10px] text-[var(--text-muted)]">AI</span>
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  title={isFullscreen ? "Exit full screen" : "Full screen"}
                >
                  {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                  {isFullscreen ? "Exit" : "Full screen"}
                </button>
              </div>
              <div className="shrink-0 border-b border-[var(--border)] px-4 py-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{cp.heyAi}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{cp.aiDocLine}</p>
              </div>
              <div ref={chatListRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
                <ChatShell
                  messages={chatMessages}
                  chatLoading={chatLoading}
                  activeStreamingIndex={activeStreamingIndex}
                />
              </div>
              <div className="shrink-0 space-y-2 border-t border-[var(--border)] bg-[var(--bg-primary)] p-3">
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
      </div>
    </AuthGate>
  );
}
