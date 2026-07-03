/** Date helpers shared by cards, chips and the hero. All inputs are 'YYYY-MM-DD'. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parse = (iso) => new Date(`${iso}T00:00:00`);

/** '2026-07-17' + '2026-07-18' → '17–18 Jul' · single day → '11 Jul' · null → 'Date TBA' */
export function formatDateRange(start, end) {
  if (!start) return 'Date TBA';
  const s = parse(start);
  if (!end) return `${s.getDate()} ${MONTHS[s.getMonth()]}`;
  const e = parse(end);
  if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]}`;
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]}`;
}

/** Whole days from today (midnight-to-midnight); negative = already happened. */
export function daysUntil(start) {
  if (!start) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parse(start) - today) / 86_400_000);
}

/** Human countdown for the card chip; null when there is no date. */
export function countdownLabel(start) {
  const d = daysUntil(start);
  if (d === null) return null;
  if (d < 0) return 'Wrapped up';
  if (d === 0) return 'Happening today';
  if (d === 1) return 'Tomorrow';
  return `In ${d} days`;
}
