import { useEffect, useState } from 'react';
import { CONFERENCES, gradientFor } from '../data/conferences';
import { supabase } from '../lib/supabase';

/** DB enum (schema.sql) → UI status used by cards and filters. */
const DB_STATUS = {
  registration_open: 'open',
  registration_soon: 'soon',
  planned: 'planned',
};

/** Map a `conferences` row to the shape the components consume. */
function rowToConference(row) {
  return {
    id: row.slug,
    name: row.name,
    short: row.abbreviation ?? row.name.slice(0, 3).toUpperCase(),
    status: DB_STATUS[row.status] ?? 'planned',
    startDate: row.starts_on,
    endDate: row.ends_on,
    city: row.city,
    registrationUrl: row.registration_url,
    logoUrl: row.logo_url,
    gradient: gradientFor(row.slug),
  };
}

/**
 * Conference feed. Starts on mock data instantly (no loading spinner), then —
 * if Supabase is configured — swaps to live rows and subscribes to Postgres
 * changes, so the board updates the moment an organizer flips a status.
 */
export function useConferences() {
  const [conferences, setConferences] = useState(CONFERENCES);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined; // mock mode

    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('conferences')
        .select('*')
        .in('status', ['registration_open', 'registration_soon', 'planned'])
        .order('starts_on', { ascending: true, nullsFirst: false });
      if (!cancelled && !error && data?.length) {
        setConferences(data.map(rowToConference));
        setIsLive(true);
      }
    };

    load();

    // Realtime: any insert/update/delete re-syncs the whole board (23 rows —
    // a refetch is simpler and safer than patching state per-event).
    const channel = supabase
      .channel('conferences-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conferences' }, load)
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { conferences, isLive };
}
