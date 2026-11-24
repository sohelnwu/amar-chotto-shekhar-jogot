import { motion } from 'framer-motion';

/** "টুনটুনি" — the app's friendly owl guide (original illustration). */
export function Mascot({ className = 'size-28', mood = 'happy' }: { className?: string; mood?: 'happy' | 'cheer' }) {
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      animate={{ y: [0, -4, 0], rotate: mood === 'cheer' ? [0, -6, 6, 0] : 0 }}
      transition={{ duration: mood === 'cheer' ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#2B2140" opacity="0.08" />
      <path d="M22 50c0-24 17-38 38-38s38 14 38 38v24c0 22-17 36-38 36S22 96 22 74z" fill="#7C5CFC" />
      <path d="M22 44 14 22l22 12M98 44l8-22-22 12" fill="#7C5CFC" />
      <ellipse cx="60" cy="82" rx="24" ry="24" fill="#B8A6FF" />
      <path d="M44 76c4 3 8 3 12 0M64 86c4 3 8 3 12 0M48 94c4 3 8 3 12 0" stroke="#7C5CFC" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="48" r="15" fill="#fff" />
      <circle cx="76" cy="48" r="15" fill="#fff" />
      <motion.g animate={{ scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ originY: '48px' }}>
        <circle cx="46" cy="49" r="7" fill="#2B2140" />
        <circle cx="74" cy="49" r="7" fill="#2B2140" />
        <circle cx="48" cy="46" r="2.4" fill="#fff" />
        <circle cx="76" cy="46" r="2.4" fill="#fff" />
      </motion.g>
      <path d="M54 60l6 8 6-8z" fill="#FFB627" />
      <circle cx="32" cy="64" r="5" fill="#FF7A9C" opacity="0.5" />
      <circle cx="88" cy="64" r="5" fill="#FF7A9C" opacity="0.5" />
      <path d="M20 72c-8 6-10 16-6 22 6-2 10-8 12-14M100 72c8 6 10 16 6 22-6-2-10-8-12-14" fill="#6A4CE8" />
      <path d="M50 108h8M62 108h8" stroke="#FFB627" strokeWidth="4" strokeLinecap="round" />
    </motion.svg>
  );
}
