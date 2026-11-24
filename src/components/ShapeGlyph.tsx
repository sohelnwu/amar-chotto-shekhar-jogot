import type { ShapeName } from '../content/types';

const PATHS: Record<ShapeName, string> = {
  circle: 'M50 8a42 42 0 1 1 0 84a42 42 0 1 1 0-84z',
  square: 'M14 14h72v72H14z',
  triangle: 'M50 10L92 86H8z',
  rectangle: 'M6 26h88v48H6z',
  star: 'M50 6l12.9 27.6 30.1 3.6-22.3 20.6 5.9 29.8L50 72.8 23.4 87.6l5.9-29.8L7 37.2l30.1-3.6z',
  heart: 'M50 88S8 62 8 34a20 20 0 0 1 42-10a20 20 0 0 1 42 10c0 28-42 54-42 54z',
  oval: 'M50 6c20 0 34 20 34 44S70 94 50 94 16 74 16 50 30 6 50 6z',
  diamond: 'M50 4l40 46-40 46-40-46z',
};

export function ShapeGlyph({
  shape,
  color,
  className,
  label,
}: {
  shape: ShapeName;
  color: string;
  className?: string;
  label?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={label}>
      <path d={PATHS[shape]} fill={color} stroke="white" strokeWidth="4" strokeLinejoin="round" />
      <path d={PATHS[shape]} fill="url(#shine)" opacity="0.35" />
      <defs>
        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
