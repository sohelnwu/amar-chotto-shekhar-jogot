import { useState } from 'react';
import type { LearningItem } from '../content/types';
import { ShapeGlyph } from './ShapeGlyph';

interface Props {
  item: LearningItem;
  size: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  /** show counting objects for numbers */
  showCount?: boolean;
}

const EMOJI = { sm: 'text-4xl', md: 'text-6xl', lg: 'text-7xl sm:text-8xl', xl: 'text-[9rem] sm:text-[11rem]' };
const SYMBOL = { sm: 'text-4xl', md: 'text-6xl', lg: 'text-8xl', xl: 'text-[8rem] sm:text-[10rem]' };
const BOX = { sm: 'size-14', md: 'size-24', lg: 'size-28 sm:size-36', xl: 'size-52 sm:size-64' };

/** Renders the best available visual: licensed image → shape → colour swatch → glyph → emoji. */
export function ItemVisual({ item, size, color = '#7C5CFC', showCount }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  if (item.image && !imgFailed) {
    return (
      <img
        src={item.image}
        alt={item.bengaliName}
        onError={() => setImgFailed(true)}
        className={`${BOX[size]} rounded-3xl object-cover`}
        draggable={false}
      />
    );
  }
  if (item.shape) {
    return <ShapeGlyph shape={item.shape} color={color} className={BOX[size]} label={item.bengaliName} />;
  }
  if (item.swatch) {
    return (
      <span
        role="img"
        aria-label={item.bengaliName}
        className={`${BOX[size]} inline-block rounded-full shadow-inner ring-4 ring-white`}
        style={{
          background: `radial-gradient(circle at 30% 30%, ${item.swatch}cc, ${item.swatch})`,
          boxShadow: item.swatch.toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 2px #e5e0d6' : undefined,
        }}
      />
    );
  }
  if (item.symbol) {
    return (
      <span className="flex flex-col items-center gap-1">
        <span className={`${SYMBOL[size]} font-bold leading-none`} style={{ color }}>
          {item.symbol}
        </span>
        {showCount && item.count && item.emoji && <CountRow emoji={item.emoji} count={item.count} />}
        {!showCount && !item.count && item.emoji && size !== 'sm' && size !== 'md' && (
          <span className="emoji text-5xl sm:text-6xl" aria-hidden>
            {item.emoji}
          </span>
        )}
      </span>
    );
  }
  return (
    <span role="img" aria-label={item.bengaliName} className={`emoji ${EMOJI[size]}`}>
      {item.emoji}
    </span>
  );
}

export function CountRow({ emoji, count, big }: { emoji: string; count: number; big?: boolean }) {
  return (
    <span
      className={`emoji grid gap-1 ${big ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}
      style={{ gridTemplateColumns: `repeat(${Math.min(count, 5)}, minmax(0, 1fr))` }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{emoji}</span>
      ))}
    </span>
  );
}
