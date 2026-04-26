"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "zinvest-pwa-install-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; /* 7 days */

function isStandalone(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function PwaInstallClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw && Date.now() - Number(raw) < DISMISS_TTL_MS) return;
    } catch {
      /* ignore */
    }

    setHidden(false);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
    setDeferred(null);
    setShowIosHint(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  if (hidden || isStandalone()) return null;

  const ios = isIos();
  const showChromeInstall = Boolean(deferred);
  const showIosCard = ios && !showChromeInstall;

  if (!showChromeInstall && !showIosCard) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[190] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none"
      aria-live="polite"
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Install Zinvest</p>
            {showChromeInstall ? (
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                Add to your home screen for a fullscreen app experience and faster access.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                Tap <Share className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom text-blue-400" /> Share,
                then &quot;Add to Home Screen&quot;.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--accent-bg)] hover:text-[var(--text-primary)] touch-manipulation"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {showChromeInstall && (
            <button
              type="button"
              onClick={() => void install()}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-blue-500 px-4 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-600 active:scale-[0.98] sm:flex-none"
            >
              <Download className="h-4 w-4" />
              Install app
            </button>
          )}
          {showIosCard && (
            <button
              type="button"
              onClick={() => setShowIosHint((v) => !v)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-tertiary)] px-4 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-bg)] sm:flex-none"
            >
              <Share className="h-4 w-4 text-blue-400" />
              {showIosHint ? "Hide steps" : "How to install"}
            </button>
          )}
        </div>
        {showIosHint && showIosCard && (
          <ol className="list-decimal space-y-1 pl-4 text-left text-[11px] text-[var(--text-tertiary)]">
            <li>Tap the Share button in Safari.</li>
            <li>Scroll and tap &quot;Add to Home Screen&quot;.</li>
            <li>Confirm — Zinvest opens like an app.</li>
          </ol>
        )}
      </div>
    </div>
  );
}
