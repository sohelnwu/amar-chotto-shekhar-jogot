import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';

const BITS = ['⭐', '🌟', '✨', '🎈', '💖', '🌈'];

/** Short burst of stars for correct answers. Purely decorative. */
export function Celebration({ show }: { show: boolean }) {
  const parts = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        e: BITS[i % BITS.length],
        x: (Math.random() - 0.5) * 320,
        y: -80 - Math.random() * 220,
        r: (Math.random() - 0.5) * 120,
      })),
    [show], // regenerate per burst
  );
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center" aria-hidden>
          {parts.map((p) => (
            <motion.span
              key={p.id}
              className="emoji absolute text-4xl"
              initial={{ opacity: 1, x: 0, y: 40, scale: 0.4 }}
              animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.3, rotate: p.r }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
            >
              {p.e}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
