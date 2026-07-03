import { Globe2, Send } from 'lucide-react';

/** Minimal footer: brand, tagline, community link, copyright. */
export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400">
            <Globe2 size={17} className="text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-white">MUNHub</p>
            <p className="text-xs text-slate-500">The radar for Uzbekistan&apos;s MUN community.</p>
          </div>
        </div>

        <a
          href="https://t.me"
          target="_blank"
          rel="noreferrer"
          className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-300"
        >
          <Send size={15} className="text-sky-300" aria-hidden="true" />
          Join the Telegram community
        </a>

        <p className="text-xs text-slate-600">© 2026 MUNHub. Built by delegates, for delegates.</p>
      </div>
    </footer>
  );
}
