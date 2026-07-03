import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe2, Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#tracker', label: 'Tracker' },
  { href: '#academy', label: 'Academy' },
  { href: '#planned', label: 'Planned' },
];

/** Fixed glass top bar with logo, anchor nav and auth CTAs. */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-night-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5" aria-label="MUNHub home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 shadow-glow">
            <Globe2 size={20} className="text-white" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-white">
            MUNHub
          </span>
          <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
            UZ
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Auth actions */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            className="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            Sign in
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
          >
            Join free
          </button>
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="grid h-11 w-11 cursor-pointer place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/[0.06] md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Join free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
