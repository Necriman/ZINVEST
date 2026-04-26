import type { UnitKey } from "@/lib/unit-test-content";

const PROGRESS_KEY = "zinvest-learning-progress-v1";

export type UnitQuizMeta = { submittedAt: string; bestScorePct: number; lastTimeSec: number };

export type ProgressState = {
  lessons: Record<string, boolean>;
  unitQuizzes: Partial<Record<UnitKey, UnitQuizMeta>>;
};

function emptyState(): ProgressState {
  return { lessons: {}, unitQuizzes: {} };
}

export function loadProgress(): ProgressState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyState();
    const p = JSON.parse(raw) as Partial<ProgressState>;
    return {
      lessons: typeof p.lessons === "object" && p.lessons ? p.lessons : {},
      unitQuizzes: typeof p.unitQuizzes === "object" && p.unitQuizzes ? p.unitQuizzes : {},
    };
  } catch {
    return emptyState();
  }
}

export function saveProgress(state: ProgressState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("zinvest-progress"));
}

export function lessonStorageKey(courseKey: string, lessonId: number) {
  return `${courseKey}:${lessonId}`;
}

export function setLessonComplete(courseKey: string, lessonId: number, done: boolean) {
  const s = loadProgress();
  const k = lessonStorageKey(courseKey, lessonId);
  if (done) s.lessons[k] = true;
  else delete s.lessons[k];
  saveProgress(s);
}

export function isLessonMarkedComplete(courseKey: string, lessonId: number) {
  return Boolean(loadProgress().lessons[lessonStorageKey(courseKey, lessonId)]);
}

export function recordUnitQuizAttempt(unitKey: UnitKey, scorePct: number, timeSec: number) {
  const s = loadProgress();
  const prev = s.unitQuizzes[unitKey];
  const bestScorePct = prev ? Math.max(prev.bestScorePct, scorePct) : scorePct;
  s.unitQuizzes[unitKey] = {
    submittedAt: new Date().toISOString(),
    bestScorePct,
    lastTimeSec: timeSec,
  };
  saveProgress(s);
}

export function countCompletedLessonsInUnit(unitKey: UnitKey, lessonIds: number[]) {
  const s = loadProgress();
  return lessonIds.filter((id) => s.lessons[lessonStorageKey(unitKey, id)]).length;
}

export function isUnitFullyComplete(unitKey: UnitKey, lessonIds: number[]) {
  if (!lessonIds.length) return false;
  return countCompletedLessonsInUnit(unitKey, lessonIds) === lessonIds.length;
}

export function overallLessonProgress(allUnits: Array<{ key: UnitKey; lessonIds: number[] }>) {
  let total = 0;
  let done = 0;
  for (const u of allUnits) {
    for (const id of u.lessonIds) {
      total += 1;
      if (isLessonMarkedComplete(u.key, id)) done += 1;
    }
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function completedUnitsCount(allUnits: Array<{ key: UnitKey; lessonIds: number[] }>) {
  return allUnits.filter((u) => isUnitFullyComplete(u.key, u.lessonIds)).length;
}

export function bestQuizScoreAcrossUnits(keys: UnitKey[]) {
  const s = loadProgress();
  let best = 0;
  for (const k of keys) {
    const m = s.unitQuizzes[k];
    if (m && m.bestScorePct > best) best = m.bestScorePct;
  }
  return best;
}

export function quizzesCompletedCount(keys: UnitKey[]) {
  const s = loadProgress();
  return keys.filter((k) => s.unitQuizzes[k]).length;
}
