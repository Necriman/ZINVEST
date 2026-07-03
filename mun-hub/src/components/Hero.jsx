import { useEffect, useRef } from 'react';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarClock, Flame, Radar, Sparkles } from 'lucide-react';

/** Number that counts up on mount; renders instantly for reduced-motion users. */
function CountUp({ to, suffix = '' }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (reduceMotion) {
      node.textContent = `${to}${suffix}`;
      return undefined;
    }
    const controls = animate(0, to, {
      duration: 1.1,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [to, suffix, reduceMotion]);

  return <span ref={ref}>0</span>;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
};

/**
 * Hero: headline, season badge, CTAs and the four live stats.
 * `stats` = { open, soon, planned, guides } computed in App from real data.
 */
export default function Hero({ stats }) {
  const tiles = [
    { icon: Flame, label: 'Open registrations', value: stats.open, tint: 'text-emerald-300' },
    { icon: CalendarClock, label: 'Dates announced', value: stats.soon, tint: 'text-amber-300' },
    { icon: Radar, label: 'Planned conferences', value: stats.planned, tint: 'text-sky-300' },
    { icon: BookOpen, label: 'Academy guides', value: stats.guides, suffix: '+', tint: 'text-violet-300' },
  ];

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-40">
      {/* Ambient background: blueprint grid + two soft aurora blobs */}
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div
        className="absolute -top-32 left-1/4 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 right-1/4 h-80 w-80 translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {/* Season badge */}
        <motion.div variants={item} className="flex justify-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-slate-300">
            <Sparkles size={14} className="text-indigo-300" aria-hidden="true" />
            Season 2026 · tracking {stats.open + stats.soon + stats.planned} conferences live
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="mx-auto mt-6 max-w-3xl text-center font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Every MUN in Uzbekistan,{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
            on one radar.
          </span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-slate-400 sm:text-lg"
        >
          Track registrations in real time, never miss a deadline, and grow from first-timer to
          Best Delegate with the Academy — built by MUNers, for MUNers.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#tracker"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Browse conferences
            <ArrowRight size={16} aria-hidden="true" />
          </a>
          <a
            href="#academy"
            className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-slate-200"
          >
            Explore the Academy
          </a>
        </motion.div>

        {/* Stats */}
        <motion.dl variants={item} className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {tiles.map(({ icon: Icon, label, value, suffix, tint }) => (
            <div key={label} className="glass glass-hover rounded-2xl p-4 sm:p-5">
              <Icon size={20} className={tint} aria-hidden="true" />
              <dd className="mt-3 font-display text-3xl font-bold tabular-nums text-white">
                <CountUp to={value} suffix={suffix ?? ''} />
              </dd>
              <dt className="mt-1 text-xs font-medium text-slate-400">{label}</dt>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
