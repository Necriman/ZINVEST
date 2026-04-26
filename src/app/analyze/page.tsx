"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import Navigation from "@/components/sections/navigation";
import { useLanguage } from "@/lib/language-context";

export default function AnalyzePage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    router.replace("/ai?mode=analyze");
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0a0f1c] flex flex-col">
      <Navigation />
      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <p className="text-sm text-slate-400">{t.analyzeRedirectMessage}</p>
      </div>
    </main>
  );
}
