export const FINANCE_COURSE_ID = "finance-fundamentals" as const;

export const FINANCE_LESSON_IDS = [1, 2] as const;

export function isFinanceLessonId(id: number): id is 1 | 2 {
  return id === 1 || id === 2;
}

export function courseLessonPath(courseId: string, lessonId: number) {
  return `/courses/${courseId}/lessons/${lessonId}`;
}

export function courseListPath(courseId: string) {
  return `/courses/${courseId}`;
}
