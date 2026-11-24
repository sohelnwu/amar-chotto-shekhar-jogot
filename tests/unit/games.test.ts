import { describe, expect, it } from 'vitest';
import type { AgeLevel } from '../../src/content/types';
import {
  gameTopics,
  makeAddRound,
  makeChoiceRound,
  makeCountRound,
  makeMemoryDeck,
  makeMissingRound,
  makeOddRound,
  topicPool,
  visualKey,
} from '../../src/games/logic';

const LEVELS: AgeLevel[] = [1, 2, 3];

describe('game round generators', () => {
  it('choice rounds: answer included, options distinct, for every topic and level', () => {
    for (const level of LEVELS) {
      for (const t of [...gameTopics(level).map((c) => c.id), 'mix']) {
        const pool = topicPool(t, level);
        for (let i = 0; i < 20; i++) {
          const n = level === 1 ? 3 : 4;
          const r = makeChoiceRound(pool, n);
          expect(r, `${t} L${level}`).not.toBeNull();
          expect(r!.options).toHaveLength(n);
          expect(r!.options.map((o) => o.id)).toContain(r!.answer.id);
          expect(new Set(r!.options.map(visualKey)).size, `${t} visuals`).toBe(n);
          expect(new Set(r!.options.map((o) => o.bengaliName)).size, `${t} names`).toBe(n);
        }
      }
    }
  });

  it('memory deck has exact pairs sized by level', () => {
    for (const level of LEVELS) {
      const deck = makeMemoryDeck(topicPool('fruits', level), level);
      const expected = level === 1 ? 3 : level === 2 ? 4 : 6;
      expect(deck).toHaveLength(Math.min(expected, topicPool('fruits', level).length) * 2);
      const counts = new Map<string, number>();
      deck.forEach((c) => counts.set(c.item.id, (counts.get(c.item.id) ?? 0) + 1));
      expect([...counts.values()].every((v) => v === 2)).toBe(true);
    }
  });

  it('count rounds contain the right answer within range', () => {
    for (let i = 0; i < 200; i++) {
      const r = makeCountRound(1);
      expect(r.count).toBeGreaterThanOrEqual(1);
      expect(r.count).toBeLessThanOrEqual(5);
      expect(r.options).toContain(r.count);
      expect(new Set(r.options).size).toBe(3);
    }
  });

  it('addition rounds stay small and include the sum', () => {
    for (let i = 0; i < 200; i++) {
      const r = makeAddRound(1);
      expect(r.a + r.b).toBeLessThanOrEqual(5);
      expect(r.options).toContain(r.a + r.b);
      expect(r.options.every((n) => n >= 1)).toBe(true);
    }
  });

  it('odd-one-out has exactly one item from another category', () => {
    for (let i = 0; i < 50; i++) {
      const r = makeOddRound(1)!;
      const same = r.options.filter((o) => o.categoryId === r.groupCategory);
      expect(same).toHaveLength(3);
      expect(r.odd.categoryId).not.toBe(r.groupCategory);
    }
  });

  it('missing-item rounds offer the missing item among new distractors', () => {
    for (let i = 0; i < 50; i++) {
      const r = makeMissingRound(topicPool('animals', 2), 2)!;
      expect(r.shown.map((s) => s.id)).toContain(r.missing.id);
      expect(r.options.map((o) => o.id)).toContain(r.missing.id);
      const distractors = r.options.filter((o) => o.id !== r.missing.id);
      expect(distractors.every((d) => !r.shown.some((s) => s.id === d.id))).toBe(true);
    }
  });
});
