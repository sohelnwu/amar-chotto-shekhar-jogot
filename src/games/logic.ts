import { categories, getItems, visibleCategories } from '../content';
import type { AgeLevel, LearningItem } from '../content/types';

export type Rng = () => number;

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const visualKey = (i: LearningItem) => i.image ?? i.shape ?? i.swatch ?? i.symbol ?? i.emoji ?? i.id;

/** Picks up to n items with unique visuals and unique names. */
export function pickDistinct(pool: readonly LearningItem[], n: number, rng: Rng = Math.random, exclude: LearningItem[] = []): LearningItem[] {
  const usedV = new Set(exclude.map(visualKey));
  const usedN = new Set(exclude.map((i) => i.bengaliName));
  const out: LearningItem[] = [];
  for (const it of shuffle(pool, rng)) {
    if (out.length >= n) break;
    if (usedV.has(visualKey(it)) || usedN.has(it.bengaliName)) continue;
    usedV.add(visualKey(it));
    usedN.add(it.bengaliName);
    out.push(it);
  }
  return out;
}

/** Categories that make sense in picture games (no duplicate visuals, no long texts). */
const NOT_FOR_GAMES = new Set(['stories', 'time', 'seasons', 'opposites', 'safety', 'habits']);

export function gameTopics(level: AgeLevel) {
  return visibleCategories(level).filter((c) => !NOT_FOR_GAMES.has(c.id) && getItems(c.id, level).length >= 4);
}

export function topicPool(topic: string, level: AgeLevel): LearningItem[] {
  if (topic && topic !== 'mix') {
    const list = getItems(topic, level);
    if (list.length >= 3) return list;
  }
  return gameTopics(level)
    .filter((c) => c.kind === 'cards')
    .flatMap((c) => getItems(c.id, level));
}

export const optionCount = (level: AgeLevel) => (level === 1 ? 3 : 4);

export interface ChoiceRound {
  answer: LearningItem;
  options: LearningItem[];
}

export function makeChoiceRound(pool: readonly LearningItem[], n: number, rng: Rng = Math.random, avoid?: string): ChoiceRound | null {
  const candidates = pool.length > n && avoid ? pool.filter((p) => p.id !== avoid) : pool;
  const answer = shuffle(candidates, rng)[0];
  if (!answer) return null;
  const others = pickDistinct(pool, n - 1, rng, [answer]);
  if (others.length < n - 1) return null;
  return { answer, options: shuffle([answer, ...others], rng) };
}

export interface OddRound {
  odd: LearningItem;
  options: LearningItem[];
  groupCategory: string;
}

export function makeOddRound(level: AgeLevel, rng: Rng = Math.random): OddRound | null {
  const cats = shuffle(
    gameTopics(level).filter((c) => c.kind === 'cards'),
    rng,
  );
  if (cats.length < 2) return null;
  const [a, b] = cats;
  const same = pickDistinct(getItems(a.id, level), 3, rng);
  const odd = pickDistinct(getItems(b.id, level), 1, rng, same)[0];
  if (same.length < 3 || !odd) return null;
  return { odd, options: shuffle([...same, odd], rng), groupCategory: a.id };
}

export interface CountRound {
  count: number;
  emoji: string;
  options: number[];
}

const COUNT_EMOJI = ['🍎', '🍌', '⭐', '🐟', '🎈', '🌸', '🐞', '🍊', '⚽', '🐥', '🦋', '🚗'];

export function makeCountRound(level: AgeLevel, rng: Rng = Math.random, avoid?: number): CountRound {
  const max = level === 1 ? 5 : 10;
  let count = 1 + Math.floor(rng() * max);
  if (count === avoid) count = (count % max) + 1;
  const emoji = COUNT_EMOJI[Math.floor(rng() * COUNT_EMOJI.length)];
  const opts = new Set([count]);
  while (opts.size < 3) {
    const delta = Math.floor(rng() * 5) - 2;
    const n = count + (delta === 0 ? 1 : delta);
    if (n >= 1 && n <= max + 2) opts.add(n);
  }
  return { count, emoji, options: shuffle([...opts], rng) };
}

export interface AddRound {
  a: number;
  b: number;
  emoji: string;
  options: number[];
}

export function makeAddRound(level: AgeLevel, rng: Rng = Math.random): AddRound {
  const max = level === 1 ? 5 : 10;
  const a = 1 + Math.floor(rng() * (max - 1));
  const b = 1 + Math.floor(rng() * (max - a));
  const sum = a + b;
  const opts = new Set([sum]);
  while (opts.size < 3) {
    const n = sum + (Math.floor(rng() * 5) - 2);
    if (n >= 1 && n !== sum) opts.add(n);
  }
  return { a, b, emoji: COUNT_EMOJI[Math.floor(rng() * COUNT_EMOJI.length)], options: shuffle([...opts], rng) };
}

export interface MemoryCard {
  key: number;
  item: LearningItem;
}

export function makeMemoryDeck(pool: readonly LearningItem[], level: AgeLevel, rng: Rng = Math.random): MemoryCard[] {
  const pairs = level === 1 ? 3 : level === 2 ? 4 : 6;
  const chosen = pickDistinct(pool, pairs, rng);
  return shuffle(
    chosen.flatMap((item, i) => [
      { key: i * 2, item },
      { key: i * 2 + 1, item },
    ]),
    rng,
  );
}

export interface MissingRound {
  shown: LearningItem[];
  missing: LearningItem;
  options: LearningItem[];
}

export function makeMissingRound(pool: readonly LearningItem[], level: AgeLevel, rng: Rng = Math.random): MissingRound | null {
  const n = level === 1 ? 3 : 4;
  const shown = pickDistinct(pool, n, rng);
  if (shown.length < n) return null;
  const missing = shown[Math.floor(rng() * n)];
  const distract = pickDistinct(pool, 2, rng, shown);
  if (distract.length < 2) return null;
  return { shown, missing, options: shuffle([missing, ...distract], rng) };
}

export const allCategoryIds = categories.map((c) => c.id);
