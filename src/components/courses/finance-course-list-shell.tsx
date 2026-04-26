"use client";

import AuthGate from "@/components/auth-gate";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { FinanceCourseList } from "@/components/courses/finance-course-list";

export function FinanceCourseListShell() {
  return (
    <AuthGate>
      <div className="min-h-dvh bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navigation />
        <main className="pt-20 md:pt-24">
          <FinanceCourseList />
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
