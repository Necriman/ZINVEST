import { escapeHtml } from "@/lib/strip-html";

export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt?: string };

export type StructuredLesson = {
  title: string;
  content: LessonBlock[];
};

/** Stored lesson: rich HTML body + title (v3). Legacy: only `content` blocks. */
export type LessonPersistV3 = {
  title: string;
  bodyHtml: string;
};

export function blocksToPlainText(lesson: StructuredLesson): string {
  const parts = [lesson.title, "", ...lesson.content.map((b) => {
    if (b.type === "image") return `[image: ${b.src}]`;
    return b.type === "heading" ? `# ${b.text}` : b.text;
  })];
  return parts.join("\n\n");
}

/** Convert block-based default lesson to HTML for Tiptap (migration + first paint). */
export function blocksToBodyHtml(lesson: StructuredLesson): string {
  const out: string[] = [];
  for (const b of lesson.content) {
    if (b.type === "heading") {
      out.push(`<h2>${escapeHtml(b.text)}</h2>`);
    } else if (b.type === "image") {
      out.push(`<img src="${escapeHtml(b.src)}" alt="${escapeHtml(b.alt ?? "")}" />`);
    } else {
      const chunks = b.text.split(/\n\n+/);
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        out.push(`<p>${escapeHtml(chunk).replace(/\n/g, "<br />")}</p>`);
      }
    }
  }
  return out.length ? out.join("") : "<p></p>";
}

export function parseStoredLessonData(raw: string | null, fallback: StructuredLesson): LessonPersistV3 {
  if (!raw?.trim()) {
    return { title: fallback.title, bodyHtml: blocksToBodyHtml(fallback) };
  }
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") {
      return { title: fallback.title, bodyHtml: blocksToBodyHtml(fallback) };
    }
    const title =
      typeof o.title === "string" && o.title.trim() ? o.title.trim() : fallback.title;
    if (typeof o.bodyHtml === "string" && o.bodyHtml.trim()) {
      return { title, bodyHtml: o.bodyHtml };
    }
    const arr = Array.isArray(o.content) ? o.content : null;
    if (arr) {
      const content = arr.filter(isLessonBlock) as LessonBlock[];
      if (content.length) {
        return { title, bodyHtml: blocksToBodyHtml({ title, content }) };
      }
    }
    return { title, bodyHtml: blocksToBodyHtml(fallback) };
  } catch {
    return { title: fallback.title, bodyHtml: blocksToBodyHtml(fallback) };
  }
}

export function persistLessonToJson(p: LessonPersistV3): string {
  return JSON.stringify({ title: p.title, bodyHtml: p.bodyHtml });
}

export function isLessonBlock(v: unknown): v is LessonBlock {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (o.type === "heading" || o.type === "paragraph") {
    return typeof o.text === "string";
  }
  if (o.type === "image") {
    return typeof o.src === "string";
  }
  return false;
}

export type LessonStoragePayload = LessonPersistV3;

export function lessonStorageKey(courseKey: string, lessonId: number, language: string): string {
  return `zinvest-lesson-v2-${courseKey}-${language}-${lessonId}`;
}
