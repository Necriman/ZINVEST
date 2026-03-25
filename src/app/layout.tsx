import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { AnalyticsProvider } from "@/lib/analytics-context";

export const metadata: Metadata = {
  title: "Zinvest — Your AI Financial Assistant",
  description: "Learn finance from scratch with AI-powered education. Zinvest helps students, young professionals, and founders understand money, business, and investing — step by step.",
  keywords: ["finance", "AI", "financial education", "investing", "money management", "fintech"],
  icons: {
    icon: "/zinvest-mark.svg",
    shortcut: "/zinvest-mark.svg",
    apple: "/zinvest-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0f1c] text-white">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="5fe6cee9-f381-485d-9f45-e9c954433897"
        />
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "Zinvest", "version": "1.0.0"}'
        />
            <LanguageProvider>
              <AuthProvider>
                <AnalyticsProvider>
                  {children}
                </AnalyticsProvider>
              </AuthProvider>
            </LanguageProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
