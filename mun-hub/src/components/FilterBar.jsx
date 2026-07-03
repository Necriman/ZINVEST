import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open now' },
  { id: 'soon', label: 'Opening soon' },
  { id: 'planned', label: 'Date TBA' },
];

/**
 * Sticky control bar: status pills (with counts + sliding active background)
 * and a search input focusable via the `/` key.
 */
export default function FilterBar({ query, onQueryChange, status, onStatusChange, counts }) {
  const inputRef = useRef(null);

  // Global "/" shortcut → focus search (ignored while typing elsewhere).
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="glass sticky top-20 z-30 flex flex-col gap-3 rounded-2xl p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
      {/* Status pills */}
      <div role="tablist" aria-label="Filter by registration status" className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = status === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onStatusChange(f.id)}
              className={`relative cursor-pointer rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                active ? 'text-night-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {/* Sliding white pill behind the active tab */}
              {active && (
                <motion.span
                  layoutId="active-filter-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-white"
                  aria-hidden="true"
                />
              )}
              <span className="relative flex items-center gap-1.5">
                {f.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    active ? 'bg-night-950/10 text-night-950' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {counts[f.id]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative sm:w-72">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search conferences…"
          aria-label="Search conferences"
          className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-16 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/50 focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 sm:block"
            aria-hidden="true"
          >
            /
          </kbd>
        )}
      </div>
    </div>
  );
}
