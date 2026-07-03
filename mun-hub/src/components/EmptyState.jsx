import { motion } from 'framer-motion';
import { SearchX } from 'lucide-react';

/** Shown when the current search + filter combination matches nothing. */
export default function EmptyState({ query, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass flex flex-col items-center gap-4 rounded-2xl px-6 py-16 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-slate-500">
        <SearchX size={26} aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-white">No conferences found</p>
        <p className="mt-1 text-sm text-slate-400">
          {query
            ? `Nothing matches “${query}” with the current filter.`
            : 'Nothing matches the current filter.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="cursor-pointer rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:border-white/25 hover:text-white"
      >
        Clear search &amp; filters
      </button>
    </motion.div>
  );
}
