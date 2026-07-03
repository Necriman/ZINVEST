import { forwardRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Radar } from 'lucide-react';

/**
 * Compact row for a date-TBA conference with a "watch" toggle.
 * forwardRef: AnimatePresence mode="popLayout" measures children via ref.
 */
const PlannedItem = forwardRef(function PlannedItem({ conference }, ref) {
  const [watching, setWatching] = useState(false);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="glass glass-hover flex items-center gap-3 rounded-xl p-3.5"
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${conference.gradient} font-display text-xs font-bold text-white`}
        aria-hidden="true"
      >
        {conference.short}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{conference.name}</p>
        <p className="text-xs text-slate-500">Date to be announced</p>
      </div>
      <button
        type="button"
        onClick={() => setWatching((v) => !v)}
        aria-pressed={watching}
        aria-label={watching ? `Stop watching ${conference.name}` : `Watch ${conference.name}`}
        className={`grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-lg border transition-colors ${
          watching
            ? 'border-sky-400/40 bg-sky-400/10 text-sky-300'
            : 'border-white/10 text-slate-500 hover:border-white/25 hover:text-white'
        }`}
      >
        <Radar size={16} aria-hidden="true" />
      </button>
    </motion.div>
  );
});

/** "Planned MUNs (Date N/A)" — the dense watchlist under the main grid. */
export default function PlannedSection({ conferences }) {
  if (conferences.length === 0) return null;

  return (
    <section id="planned" className="scroll-mt-28">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-white sm:text-2xl">
            <Radar size={20} className="text-sky-300" aria-hidden="true" />
            Planned MUNs
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-300">
              {conferences.length}
            </span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Confirmed by organizers, dates TBA. Hit the radar to get pinged the second
            registration opens.
          </p>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {conferences.map((conference) => (
            <PlannedItem key={conference.id} conference={conference} />
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
