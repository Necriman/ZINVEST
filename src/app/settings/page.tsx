"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import AuthGate from "@/components/auth-gate";

export default function SettingsPage() {
  return (
    <AuthGate>
      <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Navigation />
        <section className="px-6 pb-20 pt-28">
          <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors duration-300 hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
            <p className="mt-2 text-sm text-[var(--text-tertiary)]">
              Settings panel is ready. Connect profile, notification, and account preferences here.
            </p>
          </div>
        </section>
        <Footer />
      </main>
    </AuthGate>
  );
}
