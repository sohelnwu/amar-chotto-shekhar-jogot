import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Category, LearningItem } from '../content/types';
import { ItemVisual } from './ItemVisual';

export function CategoryCard({ cat, progress, index = 0 }: { cat: Category; progress?: number; index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.4) }}>
      <Link
        to={`/c/${cat.id}`}
        data-testid={`cat-${cat.id}`}
        className="pressable relative flex h-full min-h-36 flex-col items-center justify-center gap-2 overflow-hidden rounded-4xl p-4 text-center text-white shadow-pop"
        style={{ background: `linear-gradient(145deg, ${cat.color}, ${cat.color}d0)` }}
      >
        <span className="absolute -right-6 -top-6 size-20 rounded-full bg-white/15" aria-hidden />
        <span className="absolute -bottom-8 -left-4 size-16 rounded-full bg-white/10" aria-hidden />
        <span className={`relative grid size-20 place-items-center rounded-3xl bg-white/90 ${cat.glyph ? 'text-4xl font-bold' : 'emoji text-5xl'}`} style={cat.glyph ? { color: cat.color } : undefined}>
          {cat.emoji}
        </span>
        <span className="relative text-xl font-bold leading-tight drop-shadow-sm">{cat.bengaliName}</span>
        {progress !== undefined && (
          <span className="relative h-2 w-3/4 overflow-hidden rounded-full bg-white/30" aria-label={`অগ্রগতি ${Math.round(progress * 100)}%`}>
            <span className="block h-full rounded-full bg-white" style={{ width: `${Math.round(progress * 100)}%` }} />
          </span>
        )}
      </Link>
    </motion.div>
  );
}

export function ItemTile({
  item,
  color,
  to,
  seen,
  favorite,
  showEnglish,
  index = 0,
}: {
  item: LearningItem;
  color: string;
  to: string;
  seen?: boolean;
  favorite?: boolean;
  showEnglish?: boolean;
  index?: number;
}) {
  // letters/numbers show their glyph; label only when it adds something (e.g. "এক" under "১")
  const label = item.symbol ? (item.bengaliName !== item.symbol ? item.bengaliName : null) : item.bengaliName;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(index * 0.02, 0.4) }}>
      <Link
        to={to}
        data-testid={`item-${item.localId}`}
        className="pressable relative flex aspect-square flex-col items-center justify-center gap-1 rounded-4xl border-4 bg-white p-2 text-center shadow-pop"
        style={{ borderColor: `${color}33` }}
      >
        {favorite && <Heart className="absolute right-3 top-3 size-5 fill-berry text-berry" aria-label="প্রিয়" />}
        {seen && <span className="absolute left-3 top-3 size-3 rounded-full bg-leaf" aria-label="দেখা হয়েছে" />}
        <span className="grid flex-1 place-items-center">
          <ItemVisual item={item} size="md" color={color} />
        </span>
        {label ? (
          <span className="line-clamp-2 text-lg font-bold leading-tight sm:text-xl">{label}</span>
        ) : (
          item.emoji && (
            <span className="emoji text-2xl" aria-hidden>
              {item.emoji}
            </span>
          )
        )}
        {showEnglish && !item.symbol && <span className="text-xs font-medium text-ink-soft">{item.englishName}</span>}
      </Link>
    </motion.div>
  );
}
