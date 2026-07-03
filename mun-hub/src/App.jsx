import { useMemo, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import ConferenceGrid from './components/ConferenceGrid';
import PlannedSection from './components/PlannedSection';
import AcademySection from './components/AcademySection';
import EmptyState from './components/EmptyState';
import Footer from './components/Footer';
import { useConferences } from './hooks/useConferences';
import { ACADEMY_TRACKS } from './data/conferences';

export default function App() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data instantly; live Supabase rows + realtime once .env is configured.
  const { conferences } = useConferences();

  const normalized = query.trim().toLowerCase();
  const matchesQuery = (c) =>
    !normalized ||
    c.name.toLowerCase().includes(normalized) ||
    (c.short ?? '').toLowerCase().includes(normalized);

  // Split once; both grids and the hero stats derive from these.
  const { datedVisible, plannedVisible, counts, stats } = useMemo(() => {
    const dated = conferences.filter((c) => c.status !== 'planned');
    const planned = conferences.filter((c) => c.status === 'planned');

    return {
      datedVisible: dated.filter(
        (c) => matchesQuery(c) && (statusFilter === 'all' || statusFilter === c.status),
      ),
      plannedVisible: planned.filter(
        (c) => matchesQuery(c) && (statusFilter === 'all' || statusFilter === 'planned'),
      ),
      counts: {
        all: conferences.length,
        open: dated.filter((c) => c.status === 'open').length,
        soon: dated.filter((c) => c.status === 'soon').length,
        planned: planned.length,
      },
      stats: {
        open: dated.filter((c) => c.status === 'open').length,
        soon: dated.filter((c) => c.status === 'soon').length,
        planned: planned.length,
        guides: ACADEMY_TRACKS.reduce((sum, t) => sum + t.guides, 0),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conferences, normalized, statusFilter]);

  const nothingVisible = datedVisible.length === 0 && plannedVisible.length === 0;

  const resetFilters = () => {
    setQuery('');
    setStatusFilter('all');
  };

  return (
    // reducedMotion="user" — every Framer animation respects prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh">
        <Navbar />
        <Hero stats={stats} />

        <main className="mx-auto max-w-7xl space-y-16 px-4 pb-10 sm:px-6 lg:px-8">
          {/* ── Pillar 1: the live tracker ── */}
          <section id="tracker" className="scroll-mt-28 space-y-6">
            <FilterBar
              query={query}
              onQueryChange={setQuery}
              status={statusFilter}
              onStatusChange={setStatusFilter}
              counts={counts}
            />

            {nothingVisible ? (
              <EmptyState query={query} onReset={resetFilters} />
            ) : (
              <div className="space-y-14">
                {datedVisible.length > 0 && <ConferenceGrid conferences={datedVisible} />}
                <PlannedSection conferences={plannedVisible} />
              </div>
            )}
          </section>

          {/* ── Pillar 2: the knowledge hub ── */}
          <AcademySection />
        </main>

        <Footer />
      </div>
    </MotionConfig>
  );
}
