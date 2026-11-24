import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { audio, nameBnClip, phraseClip, primaryClip } from '../audio';
import { CountRow, ItemVisual } from '../components/ItemVisual';
import { categoryById, itemById } from '../content';
import type { LearningItem } from '../content/types';
import { toBn } from '../services/packs';
import type { GameDef } from './catalog';
import {
  makeAddRound,
  makeChoiceRound,
  makeCountRound,
  makeMemoryDeck,
  makeMissingRound,
  makeOddRound,
  optionCount,
  topicPool,
} from './logic';
import { GameShell, OptionTile, PromptButton } from './parts';
import { useGameSession } from './useGameSession';

type Props = { game: GameDef; topic: string };

const numberItem = (n: number): LearningItem | undefined => itemById.get(`numbers/${n}`);
const numberClip = (n: number, v: 'female' | 'male') => {
  const it = numberItem(n);
  return it ? nameBnClip(it, v) : { text: String(n), lang: 'bn' as const };
};
const THIRD = 'max-sm:[&>*:nth-child(3):last-child]:col-span-2 max-sm:[&>*:nth-child(3):last-child]:w-1/2 max-sm:[&>*:nth-child(3):last-child]:justify-self-center';
const gridCols = (n: number) => (n === 3 ? `grid-cols-2 sm:grid-cols-3 ${THIRD}` : 'grid-cols-2 sm:grid-cols-4');

// ---------------------------------------------------------------- Listen & find
export function ListenGame({ game, topic }: Props) {
  const s = useGameSession(game.id);
  const pool = useMemo(() => topicPool(topic, s.level), [topic, s.level]);
  const [last, setLast] = useState<string>();
  const r = useMemo(() => makeChoiceRound(pool, optionCount(s.level), Math.random, last), [pool, s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  const cat = r ? categoryById.get(r.answer.categoryId) : undefined;

  const ask = () => {
    if (!r || !cat) return;
    void audio.play(`ask:${r.answer.id}`, [primaryClip(r.answer, s.voice, cat.primaryLang), phraseClip('where', s.voice)]);
  };
  useEffect(() => {
    if (r) setLast(r.answer.id);
    const t = window.setTimeout(ask, 350);
    return () => window.clearTimeout(t);
  }, [r?.answer.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return <Empty />;
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <PromptButton onClick={ask} label="আবার শোনো" color={game.color} />
      <div className={`mt-2 grid w-full gap-3 sm:gap-4 ${gridCols(r.options.length)}`}>
        {r.options.map((o) => (
          <OptionTile
            key={o.id}
            item={o}
            isAnswer={o.id === r.answer.id}
            revealed={s.celebrate}
            disabled={s.locked}
            testId="option"
            onPick={(ok) => (ok ? s.correct(o) : s.wrong(r.answer))}
          />
        ))}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------- Picture quiz (read the name)
export function QuizGame({ game, topic }: Props) {
  const s = useGameSession(game.id);
  const pool = useMemo(() => topicPool(topic, s.level).filter((i) => !i.symbol), [topic, s.level]);
  const r = useMemo(() => makeChoiceRound(pool, 3), [pool, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void audio.play('quiz:intro', [phraseClip('quiz', s.voice)]);
  }, [r?.answer.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Empty />;
  const color = categoryById.get(r.answer.categoryId)?.color;
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <div className="mt-2 grid size-48 place-items-center rounded-[2.5rem] bg-white shadow-soft sm:size-60">
        <ItemVisual item={r.answer} size="lg" color={color} />
      </div>
      <div className="mt-5 grid w-full gap-3 sm:grid-cols-3">
        {r.options.map((o) => (
          <button
            key={o.id}
            type="button"
            data-testid="option"
            data-answer={o.id === r.answer.id ? 'yes' : 'no'}
            disabled={s.locked}
            onClick={(e) => {
              if (o.id === r.answer.id) s.correct(o, [nameBnClip(o, s.voice)]);
              else {
                e.currentTarget.classList.remove('animate-wobble');
                void e.currentTarget.offsetWidth;
                e.currentTarget.classList.add('animate-wobble');
                s.wrong(r.answer);
              }
            }}
            className={`pressable rounded-3xl border-4 bg-white px-4 py-5 text-3xl font-bold shadow-pop ${
              s.celebrate && o.id === r.answer.id ? 'border-leaf text-leaf' : 'border-transparent'
            }`}
          >
            {o.bengaliName}
          </button>
        ))}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------- Memory pairs
export function MemoryGame({ game, topic }: Props) {
  const s = useGameSession(game.id, 3);
  const pool = useMemo(() => topicPool(topic, s.level), [topic, s.level]);
  const deck = useMemo(() => makeMemoryDeck(pool, s.level), [pool, s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOpen([]);
    setMatched(new Set());
    void audio.play('memory:intro', [phraseClip('memory', s.voice)]);
  }, [deck]); // eslint-disable-line react-hooks/exhaustive-deps

  const flip = (idx: number) => {
    const card = deck[idx];
    if (s.locked || open.includes(idx) || matched.has(card.item.id) || open.length === 2) return;
    const cat = categoryById.get(card.item.categoryId)!;
    void audio.play(`mem:${card.item.id}`, [primaryClip(card.item, s.voice, cat.primaryLang)]);
    const next = [...open, idx];
    setOpen(next);
    if (next.length === 2) {
      const [a, b] = next.map((i) => deck[i]);
      if (a.item.id === b.item.id) {
        const m = new Set(matched).add(a.item.id);
        window.setTimeout(() => {
          setMatched(m);
          setOpen([]);
          if (m.size * 2 === deck.length) s.correct(a.item);
          else void audio.play('mem:match', [phraseClip('match-found', s.voice)]);
        }, 600);
      } else {
        window.setTimeout(() => setOpen([]), 1100);
      }
    }
  };

  if (deck.length < 4) return <Empty />;
  const cols = deck.length <= 6 ? 'grid-cols-3' : deck.length <= 8 ? 'grid-cols-4' : 'grid-cols-3 sm:grid-cols-4';
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <p className="my-3 text-center text-xl font-semibold text-ink-soft">একই রকম দুটো ছবি খুঁজে মেলাও</p>
      <div className={`grid w-full gap-3 ${cols}`}>
        {deck.map((c, i) => {
          const face = open.includes(i) || matched.has(c.item.id);
          return (
            <motion.button
              key={`${c.key}-${c.item.id}`}
              type="button"
              data-testid="memory-card"
              data-pair={c.item.id}
              aria-label={face ? c.item.bengaliName : 'লুকানো কার্ড'}
              onClick={() => flip(i)}
              animate={{ rotateY: face ? 0 : 180 }}
              transition={{ duration: 0.3 }}
              className={`pressable grid aspect-square place-items-center rounded-3xl shadow-pop ${
                face ? 'bg-white' : ''
              } ${matched.has(c.item.id) ? 'opacity-60' : ''}`}
              style={face ? undefined : { background: `linear-gradient(135deg, ${game.color}, ${game.color}aa)` }}
            >
              {face ? (
                <ItemVisual item={c.item} size="md" color={categoryById.get(c.item.categoryId)?.color} />
              ) : (
                <span className="emoji text-4xl opacity-80">❓</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------- Counting
export function CountGame({ game }: Props) {
  const s = useGameSession(game.id);
  const [prev, setPrev] = useState<number>();
  const r = useMemo(() => makeCountRound(s.level, Math.random, prev), [s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPrev(r.count);
    void audio.play('count:intro', [phraseClip('count', s.voice)]);
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <PromptButton onClick={() => void audio.play('count:intro', [phraseClip('count', s.voice)])} label="কয়টা আছে?" color={game.color} />
      <div className="grid min-h-40 w-full place-items-center rounded-[2.5rem] bg-white p-5 shadow-soft" data-testid="count-board" data-count={r.count}>
        <CountRow emoji={r.emoji} count={r.count} big />
      </div>
      <div className="mt-5 grid w-full grid-cols-3 gap-3">
        {r.options.map((n) => (
          <NumberOption key={n} n={n} ok={n === r.count} revealed={s.celebrate} disabled={s.locked} onPick={(ok) => (ok ? s.correct(numberItem(n), [numberClip(n, s.voice)]) : s.wrong(numberItem(r.count)))} />
        ))}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------- Addition
export function AddGame({ game }: Props) {
  const s = useGameSession(game.id);
  const r = useMemo(() => makeAddRound(s.level), [s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void audio.play('add:q', [numberClip(r.a, s.voice), phraseClip('plus', s.voice), numberClip(r.b, s.voice), phraseClip('add', s.voice)]);
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-3 rounded-[2.5rem] bg-white p-5 shadow-soft">
        <Group emoji={r.emoji} n={r.a} />
        <span className="text-5xl font-bold" style={{ color: game.color }}>+</span>
        <Group emoji={r.emoji} n={r.b} />
        <span className="text-5xl font-bold" style={{ color: game.color }}>= ?</span>
      </div>
      <div className="mt-5 grid w-full grid-cols-3 gap-3">
        {r.options.map((n) => (
          <NumberOption key={n} n={n} ok={n === r.a + r.b} revealed={s.celebrate} disabled={s.locked} onPick={(ok) => (ok ? s.correct(numberItem(n), [numberClip(n, s.voice)]) : s.wrong(numberItem(r.a + r.b)))} />
        ))}
      </div>
    </GameShell>
  );
}

function Group({ emoji, n }: { emoji: string; n: number }) {
  return (
    <span className="flex flex-col items-center gap-1 rounded-3xl bg-cream-2 p-3">
      <CountRow emoji={emoji} count={n} />
      <span className="text-2xl font-bold">{toBn(n)}</span>
    </span>
  );
}

function NumberOption({ n, ok, revealed, disabled, onPick }: { n: number; ok: boolean; revealed: boolean; disabled: boolean; onPick: (ok: boolean) => void }) {
  return (
    <button
      type="button"
      data-testid="option"
      data-answer={ok ? 'yes' : 'no'}
      disabled={disabled}
      onClick={(e) => {
        if (!ok) {
          e.currentTarget.classList.remove('animate-wobble');
          void e.currentTarget.offsetWidth;
          e.currentTarget.classList.add('animate-wobble');
        }
        onPick(ok);
      }}
      className={`pressable aspect-square rounded-4xl border-4 bg-white text-6xl font-bold shadow-pop ${revealed && ok ? 'border-leaf text-leaf' : 'border-transparent'}`}
    >
      {toBn(n)}
    </button>
  );
}

// ---------------------------------------------------------------- Odd one out
export function OddGame({ game }: Props) {
  const s = useGameSession(game.id);
  const r = useMemo(() => makeOddRound(s.level), [s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void audio.play('odd:intro', [phraseClip('odd-one', s.voice)]);
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!r) return <Empty />;
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <PromptButton onClick={() => void audio.play('odd:intro', [phraseClip('odd-one', s.voice)])} label="কোনটা আলাদা?" color={game.color} />
      <div className="mt-2 grid w-full grid-cols-2 gap-3 sm:gap-4">
        {r.options.map((o) => (
          <OptionTile
            key={o.id}
            item={o}
            isAnswer={o.id === r.odd.id}
            revealed={s.celebrate}
            disabled={s.locked}
            testId="option"
            onPick={(ok) => (ok ? s.correct(o, [nameBnClip(o, s.voice)]) : s.wrong(r.odd))}
          />
        ))}
      </div>
    </GameShell>
  );
}

// ---------------------------------------------------------------- What's missing
export function MissingGame({ game, topic }: Props) {
  const s = useGameSession(game.id, 6);
  const pool = useMemo(() => topicPool(topic, s.level).filter((i) => !i.symbol || i.emoji), [topic, s.level]);
  const r = useMemo(() => makeMissingRound(pool, s.level), [pool, s.level, s.round, s.finished]); // eslint-disable-line react-hooks/exhaustive-deps
  const [phase, setPhase] = useState<'look' | 'guess'>('look');
  useEffect(() => setPhase('look'), [r]);
  if (!r) return <Empty />;
  return (
    <GameShell title={game.bn} color={game.color} {...shell(s)}>
      <p className="my-3 text-center text-xl font-semibold text-ink-soft">
        {phase === 'look' ? 'ভালো করে দেখে মনে রাখো' : 'কোনটা হারিয়ে গেছে?'}
      </p>
      <div className="grid w-full grid-cols-4 gap-2 rounded-[2rem] bg-white p-3 shadow-soft" data-testid="missing-board">
        {r.shown.map((it) => (
          <div key={it.id} className="grid aspect-square place-items-center rounded-2xl bg-cream-2">
            {phase === 'guess' && it.id === r.missing.id && !s.celebrate ? (
              <span className="text-5xl font-bold text-ink-soft">?</span>
            ) : (
              <ItemVisual item={it} size="sm" color={categoryById.get(it.categoryId)?.color} />
            )}
          </div>
        ))}
      </div>
      {phase === 'look' ? (
        <button
          type="button"
          data-testid="ready"
          onClick={() => setPhase('guess')}
          className="pressable mt-6 rounded-full px-8 py-4 text-2xl font-bold text-white shadow-pop"
          style={{ background: game.color }}
        >
          মনে রেখেছি 👍
        </button>
      ) : (
        <div className="mt-5 grid w-full grid-cols-3 gap-3">
          {r.options.map((o) => (
            <OptionTile
              key={o.id}
              item={o}
              big={false}
              isAnswer={o.id === r.missing.id}
              revealed={s.celebrate}
              disabled={s.locked}
              testId="option"
              onPick={(ok) => (ok ? s.correct(o, [nameBnClip(o, s.voice)]) : s.wrong(r.missing))}
            />
          ))}
        </div>
      )}
    </GameShell>
  );
}

// ----------------------------------------------------------------
function shell(s: ReturnType<typeof useGameSession>) {
  return { round: s.round, finished: s.finished, celebrate: s.celebrate, stars: s.stars, total: s.total, onRestart: s.restart };
}

function Empty() {
  return <p className="p-10 text-center text-xl text-ink-soft">এই বিষয়ে খেলার মতো যথেষ্ট ছবি নেই। অন্য বিষয় বেছে নাও।</p>;
}
