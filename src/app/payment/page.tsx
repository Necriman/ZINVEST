"use client";

import React from "react";
import Link from "next/link";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { ArrowLeft, Mail, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function PaymentPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />

      <section className="relative px-6 pt-24 pb-24">
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Payments</h1>
                <p className="text-sm text-slate-400 mt-1">
                  {`We can't integrate payment options right now.`}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-slate-300 text-sm leading-relaxed">
                {`To purchase / subscribe, contact `}
                <a
                  href="https://twitter.com/fuhrtr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  @fuhrtr
                </a>
                {` for payments.`}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {`Once you reach out, we’ll share the available payment method and next steps.`}
              </p>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm text-slate-300">
                {t.paywall?.trialDisclaimer
                  ? `Note: premium includes ${t.paywall.feature1.toLowerCase().replace(/\.$/, "")}.`
                  : "Premium includes unlimited AI access."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

