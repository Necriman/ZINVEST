const PREFIX = "zinvest-lesson-chat-v1";

export type ChatMsg = { role: "user" | "ai"; content: string };

export function chatStorageKey(courseKey: string, language: string, lessonId: number) {
  return `${PREFIX}-${courseKey}-${language}-${lessonId}`;
}

export function accessStorageKey(courseKey: string, lessonId: number) {
  return `zinvest-lesson-access-v1-${courseKey}-${lessonId}`;
}

export function loadLessonChat(key: string, welcomeAi: ChatMsg): ChatMsg[] {
  if (typeof window === "undefined") return [welcomeAi];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw?.trim()) return [welcomeAi];
    const p = JSON.parse(raw) as { messages?: ChatMsg[] };
    if (Array.isArray(p.messages) && p.messages.length > 0) {
      return p.messages.map((m) => ({
        role: m.role === "user" ? "user" : "ai",
        content: typeof m.content === "string" ? m.content : "",
      }));
    }
  } catch {
    /* ignore */
  }
  return [welcomeAi];
}

export function saveLessonChat(key: string, messages: ChatMsg[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ v: 1, messages }));
  } catch {
    /* quota */
  }
}

export function touchLessonAccess(courseKey: string, lessonId: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(accessStorageKey(courseKey, lessonId), String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function getLessonAccessAt(courseKey: string, lessonId: number): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(accessStorageKey(courseKey, lessonId));
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
