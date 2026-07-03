import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, Crown, Gavel, GraduationCap } from 'lucide-react';
import { ACADEMY_TRACKS } from '../data/conferences';

const TRACK_ICONS = {
  'starter-pack': BookOpen,
  'rules-of-procedure': Gavel,
  'chairs-handbook': Crown,
};

/** Knowledge Hub teaser (pillar 2) — three learning tracks by experience level. */
export default function AcademySection() {
  return (
    <section id="academy" className="scroll-mt-28">
      <div className="mb-5">
        <h2 className="flex items-center gap-2.5 font-display text-xl font-semibold text-white sm:text-2xl">
          <GraduationCap size={22} className="text-violet-300" aria-hidden="true" />
          The Academy
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-slate-400">
          Guides, rules of procedure and playbooks — structured by experience level, from your
          first placard to running the dais.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ACADEMY_TRACKS.map((track, i) => {
          const Icon = TRACK_ICONS[track.id] ?? BookOpen;
          return (
            <motion.a
              key={track.id}
              href="#academy"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 220, damping: 24 }}
              whileHover={{ y: -4 }}
              className="glass glass-hover group flex flex-col gap-3 rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <ArrowUpRight
                  size={17}
                  className="text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-white"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-white">{track.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{track.blurb}</p>
              </div>
              <div className="mt-auto flex items-center gap-2 pt-1 text-xs font-medium">
                <span className="rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-violet-300">
                  {track.level}
                </span>
                <span className="text-slate-500">{track.guides} guides</span>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
