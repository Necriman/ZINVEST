import { notFound } from "next/navigation";
import { FINANCE_COURSE_ID } from "@/lib/finance-course";
import { FinanceCourseListShell } from "@/components/courses/finance-course-list-shell";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (courseId !== FINANCE_COURSE_ID) notFound();
  return <FinanceCourseListShell />;
}
