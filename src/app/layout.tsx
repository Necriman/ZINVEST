import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { LanguageProvider } from "@/lib/language-context";
import { AuthProvider } from "@/lib/auth-context";
import { AnalyticsProvider } from "@/lib/analytics-context";
import { PwaInstallClient } from "@/components/pwa/pwa-install-client";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Zinvest — Your AI Financial Assistant",
  description: "Learn finance from scratch with AI-powered education. Zinvest helps students, young professionals, and founders understand money, business, and investing — step by step.",
  keywords: ["finance", "AI", "financial education", "investing", "money management", "fintech"],
  applicationName: "Zinvest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zinvest",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/zinvest-mark.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon-192.png",
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="zinvest-theme-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var key='zinvest-theme';var stored=localStorage.getItem(key);var theme=stored||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',theme);if(theme==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.setAttribute('data-theme','light');document.documentElement.classList.remove('dark');}})();`}
        </Script>
      </head>
      <body className="min-h-dvh overflow-x-hidden antialiased bg-background text-foreground">
        <Script id="zinvest-lang-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var k="zinvest-language",v=localStorage.getItem(k);if(v==="en"||v==="ru"||v==="uz")document.documentElement.lang=v;}catch(e){}})();`}
        </Script>
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
            <ThemeProvider>
              <AnalyticsProvider>
                {children}
                <PwaInstallClient />
              </AnalyticsProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
