import { motion } from 'framer-motion';
import { RotateCcw, Volume2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Celebration } from '../components/Celebration';
import { ItemVisual } from '../components/ItemVisual';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/TopBar';
import { categoryById } from '../content';
import type { LearningItem } from '../content/types';
import { toBn } from '../services/packs';


export function GameShell({
  title,
  color,
  round,
  finished,
  celebrate,
  stars,
  total,
  onRestart,
  children,
}: {
  title: string;
  color: string;
  round: number;
  finished: boolean;
  celebrate: boolean;
  stars: number;
  total: number;
  onRestart: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-playful child-area flex min-h-dvh flex-col pb-8">
      <TopBar title={title} color={color} back="/games" />
      <div className="mx-auto mb-2 flex gap-1.5" aria-label={`ধাপ ${toBn(round + 1)} / ${toBn(total)}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="h-3 w-6 rounded-full transition-colors" style={{ background: i < round || finished ? color : i === round ? `${color}88` : '#0000001a' }} />
        ))}
      </div>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-3 sm:px-6">
        {finished ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 w-full rounded-[2.5rem] bg-white p-8 text-center shadow-soft" data-testid="game-done">
            <Mascot className="mx-auto size-36" mood="cheer" />
            <h2 className="mt-3 text-4xl font-bold" style={{ color }}>
              খেলা শেষ! 🎉
            </h2>
            <p className="mt-2 text-xl">তুমি দারুণ খেলেছ!</p>
            <p className="emoji mt-3 text-4xl" aria-label={`${toBn(stars)}টি তারা`}>
              {'⭐'.repeat(Math.max(1, Math.round((stars / total) * 5)))}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={onRestart} className="pressable inline-flex items-center gap-2 rounded-full px-6 py-3 text-xl font-bold text-white shadow-pop" style={{ background: color }}>
                <RotateCcw /> আবার খেলি
              </button>
              <Link to="/games" className="pressable rounded-full bg-cream-2 px-6 py-3 text-xl font-bold shadow-pop">
                অন্য খেলা
              </Link>
            </div>
          </motion.div>
        ) : (
          children
        )}
      </main>
      <Celebration show={celebrate} />
    </div>
  );
}

export function PromptButton({ onClick, label, color }: { onClick: () => void; label: string; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="prompt"
      className="pressable mx-auto my-3 inline-flex items-center gap-3 rounded-full px-6 py-3 text-2xl font-bold text-white shadow-pop"
      style={{ background: color }}
    >
      <Volume2 className="size-8" /> {label}
    </button>
  );
}

export function OptionTile({
  item,
  onPick,
  isAnswer,
  revealed,
  disabled,
  label,
  testId,
  big = true,
}: {
  item: LearningItem;
  onPick: (ok: boolean) => void;
  isAnswer: boolean;
  revealed: boolean;
  disabled?: boolean;
  label?: string;
  testId?: string;
  big?: boolean;
}) {
  const [shake, setShake] = useState(0);
  const color = categoryById.get(item.categoryId)?.color ?? '#7C5CFC';
  return (
    <motion.button
      type="button"
      data-testid={testId}
      data-answer={isAnswer ? 'yes' : 'no'}
      aria-label={label ?? item.bengaliName}
      disabled={disabled}
      onClick={() => {
        if (!isAnswer) setShake((s) => s + 1);
        onPick(isAnswer);
      }}
      key={shake}
      className={`pressable relative grid aspect-square w-full place-items-center rounded-4xl border-4 bg-white p-3 shadow-pop ${shake && !isAnswer ? 'animate-wobble' : ''}`}
      style={{ borderColor: revealed && isAnswer ? '#3FB47C' : `${color}33` }}
      animate={revealed && isAnswer ? { scale: [1, 1.12, 1] } : {}}
    >
      {label ? <span className="text-3xl font-bold sm:text-4xl">{label}</span> : <ItemVisual item={item} size={big ? 'lg' : 'md'} color={color} />}
      {revealed && isAnswer && <span className="emoji absolute -right-2 -top-2 text-4xl">✅</span>}
    </motion.button>
  );
}
