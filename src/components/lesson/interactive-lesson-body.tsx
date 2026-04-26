"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StructuredLesson } from "@/lib/lesson-blocks";
import {
  blocksToBodyHtml,
  lessonStorageKey,
  parseStoredLessonData,
  persistLessonToJson,
} from "@/lib/lesson-blocks";
import { stripHtml } from "@/lib/strip-html";
import { cn } from "@/lib/utils";
import { LessonBodyTiptap } from "@/components/lesson/lesson-body-tiptap";

const PERSIST_DEBOUNCE_MS = 700;
const SNAPSHOT_DEBOUNCE_MS = 500;

type Props = {
  courseKey: string;
  lessonId: number;
  language: string;
  base: StructuredLesson;
  focusReading?: boolean;
  editHint: string;
  /** Shown while local save is pending */
  saveStatusSaving: string;
  saveStatusSaved: string;
  /** Placeholder inside the lesson body editor */
  lessonBodyPlaceholder: string;
  onSnapshot: (s: { title: string; plainBody: string }) => void;
  /** Sticky top format bar in Tiptap (course lesson workspace) */
  showTopFormatToolbar?: boolean;
  tiptapToolbarClassName?: string;
};

export function InteractiveLessonBody({
  courseKey,
  lessonId,
  language,
  base,
  focusReading = false,
  editHint,
  saveStatusSaving,
  saveStatusSaved,
  lessonBodyPlaceholder,
  onSnapshot,
  showTopFormatToolbar = false,
  tiptapToolbarClassName,
}: Props) {
  const key = lessonStorageKey(courseKey, lessonId, language);
  const [persist, setPersist] = useState(() => ({
    title: base.title,
    bodyHtml: blocksToBodyHtml(base),
  }));
  const [loadGen, setLoadGen] = useState(0);
  const [saveUi, setSaveUi] = useState<"saving" | "saved">("saved");

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const lastBodyPlainRef = useRef(stripHtml(persist.bodyHtml));
  const lastSavedRef = useRef(persistLessonToJson(persist));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = parseStoredLessonData(localStorage.getItem(key), base);
    setPersist(p);
    lastBodyPlainRef.current = stripHtml(p.bodyHtml);
    setLoadGen((g) => g + 1);
    setSaveUi("saved");
  }, [key, base]);

  const flushPersist = useCallback(() => {
    if (typeof window === "undefined") return;
    const json = persistLessonToJson(persistRef.current);
    if (json === lastSavedRef.current) {
      setSaveUi("saved");
      return;
    }
    setSaveUi("saving");
    try {
      localStorage.setItem(key, json);
      lastSavedRef.current = json;
    } catch {
      /* ignore quota */
    }
    setSaveUi("saved");
  }, [key]);

  const handleDocumentChange = useCallback(
    (bodyHtml: string, plain: string) => {
      lastBodyPlainRef.current = plain;
      setPersist((prev) => ({ ...prev, bodyHtml }));
      setSaveUi("saving");

      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
      snapshotTimer.current = setTimeout(() => {
        const t = persistRef.current.title;
        onSnapshotRef.current({ title: t, plainBody: `${t}\n\n${plain}`.trim() });
      }, SNAPSHOT_DEBOUNCE_MS);

      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
    },
    [flushPersist],
  );

  const setTitle = useCallback(
    (title: string) => {
      setPersist((p) => ({ ...p, title }));
      setSaveUi("saving");
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
      snapshotTimer.current = setTimeout(() => {
        const t = persistRef.current.title;
        onSnapshotRef.current({ title: t, plainBody: `${t}\n\n${lastBodyPlainRef.current}`.trim() });
      }, SNAPSHOT_DEBOUNCE_MS);
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
    },
    [flushPersist],
  );

  useEffect(() => {
    return () => {
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
      if (persistTimer.current) {
        clearTimeout(persistTimer.current);
        if (typeof window !== "undefined") {
          try {
            const json = persistLessonToJson(persistRef.current);
            if (json !== lastSavedRef.current) {
              localStorage.setItem(key, json);
            }
          } catch {
            /* ignore */
          }
        }
      }
    };
  }, [key]);

  return (
    <div className={cn("w-full", focusReading && "mx-auto max-w-prose")}>
      <div className="mb-1 flex min-h-[1.25rem] flex-wrap items-baseline justify-between gap-2 text-[11px] text-[var(--text-muted)]">
        <p>{editHint}</p>
        <p aria-live="polite" className="shrink-0 text-[10px] text-[var(--text-muted)]">
          {saveUi === "saving" ? saveStatusSaving : saveStatusSaved}
        </p>
      </div>

      <input
        type="text"
        name="lesson-title"
        value={persist.title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-1 w-full border-0 bg-transparent px-0.5 py-0.5 text-xl font-bold text-[var(--text-primary)] outline-none ring-0 focus:ring-0 focus-visible:ring-0"
        spellCheck
      />

      <div className="mt-1">
        <LessonBodyTiptap
          key={`${key}-g${loadGen}`}
          initialHtml={persist.bodyHtml}
          onDocumentChange={handleDocumentChange}
          placeholder={lessonBodyPlaceholder}
          showTopToolbar={showTopFormatToolbar}
          toolbarSurfaceClassName={tiptapToolbarClassName}
        />
      </div>
    </div>
  );
}
