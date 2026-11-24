import { ArrowLeft, Home } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfflineBadge } from './OfflineBadge';

interface Props {
  title: string;
  subtitle?: string;
  color?: string;
  back?: string;
  right?: ReactNode;
}

export function TopBar({ title, subtitle, color = '#7C5CFC', back, right }: Props) {
  const nav = useNavigate();
  return (
    <header className="safe-top sticky top-0 z-30 bg-cream/85 px-3 pb-2 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <button
          type="button"
          aria-label="পেছনে যাও"
          onClick={() => (back ? nav(back) : nav(-1))}
          className="pressable grid size-14 shrink-0 place-items-center rounded-2xl text-white shadow-pop"
          style={{ background: color }}
        >
          <ArrowLeft className="size-7" strokeWidth={3} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-soft">{subtitle}</p>}
        </div>
        <OfflineBadge compact />
        {right}
        <button
          type="button"
          aria-label="হোমে যাও"
          onClick={() => nav('/')}
          className="pressable grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-ink shadow-pop"
        >
          <Home className="size-7" strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
