import { AnimatePresence, motion } from 'framer-motion';
import ConferenceCard from './ConferenceCard';

/**
 * Responsive card grid. `layout` + AnimatePresence make cards glide into new
 * positions when filters change instead of snapping.
 */
export default function ConferenceGrid({ conferences }) {
  return (
    <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {conferences.map((conference) => (
          <ConferenceCard key={conference.id} conference={conference} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
