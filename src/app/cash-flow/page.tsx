"use client";

import AuthGate from "@/components/auth-gate";
import CashFlowDashboard from "@/components/cash-flow/cash-flow-dashboard";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

export default function CashFlowPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
          <div className="absolute -right-1/4 bottom-0 h-[480px] w-[480px] rounded-full bg-sky-600/15 blur-[110px]" />
        </div>
        <Navigation />
        <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-32 pt-28 md:px-6">
          <CashFlowDashboard />
        </main>
        <div className="relative z-10 mt-auto w-full shrink-0">
          <Footer />
        </div>
      </div>
    </AuthGate>
  );
}
