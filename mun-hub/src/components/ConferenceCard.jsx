import { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Bookmark, BookmarkCheck, CalendarDays, ExternalLink, MapPin } from 'lucide-react';
import { STATUS } from '../data/conferences';
import { countdownLabel, formatDateRange } from '../lib/utils';

/**
 * Glass card for a dated conference: monogram, status badge, date + countdown,
 * and the primary action (Register / Notify me). Bookmark is local-state demo —
 * wire it to `saved_muns` once auth lands.
 *
 * forwardRef is required: AnimatePresence mode="popLayout" measures exiting
 * children through a ref.
 */
const ConferenceCard = forwardRef(function ConferenceCard({ conference }, ref) {
  const [saved, setSaved] = useState(false);
  const [watching, setWatching] = useState(false);

  const status = STATUS[conference.status];
  const countdown = countdownLabel(conference.startDate);
  const isOpen = conference.status === 'open';

  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      whileHover={{ y: -4 }}
      className="glass glass-hover group flex flex-col gap-4 rounded-2xl p-5 shadow-card"
    >
      {/* Top row: monogram · badge · bookmark */}
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${conference.gradient} font-display text-sm font-bold text-white shadow-card`}
          aria-hidden="true"
        >
          {conference.short}
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.badge}`}
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              {status.pulse && (
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.dot} opacity-60`} />
              )}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${status.dot}`} />
            </span>
            {status.label}
          </span>

          <button
            type="button"
            onClick={() => setSaved((v) => !v)}
            aria-label={saved ? `Remove ${conference.name} from saved` : `Save ${conference.name}`}
            aria-pressed={saved}
            className={`grid h-9 w-9 cursor-pointer place-items-center rounded-lg transition-colors ${
              saved ? 'text-indigo-300' : 'text-slate-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
          </button>
        </div>
      </div>

      {/* Title + location */}
      <div>
        <h3 className="font-display text-lg font-semibold leading-snug text-white">
          {conference.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin size={13} aria-hidden="true" />
          {conference.city}
        </p>
      </div>

      {/* Date + countdown chips */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 font-medium text-slate-300">
          <CalendarDays size={14} className="text-indigo-300" aria-hidden="true" />
          {formatDateRange(conference.startDate, conference.endDate)}
        </span>
        {countdown && (
          <span className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium tabular-nums text-slate-400">
            {countdown}
          </span>
        )}
      </div>

      {/* Primary action — pinned to the bottom so all cards align */}
      <div className="mt-auto pt-1">
        {isOpen ? (
          <a
            href={conference.registrationUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white transition-all hover:opacity-90 group-hover:shadow-glow"
          >
            Register now
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setWatching((v) => !v)}
            aria-pressed={watching}
            className={`flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
              watching
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-300'
                : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
            }`}
          >
            <BellRing size={15} aria-hidden="true" />
            {watching ? 'Watching — we’ll ping you' : 'Notify me when it opens'}
          </button>
        )}
      </div>
    </motion.article>
  );
});

export default ConferenceCard;
