import { useCallback, useEffect, useRef, useState } from 'react';
import { audio, phraseClip, randomPraise, randomRetry } from '../audio';
import type { Clip } from '../audio/AudioEngine';
import type { LearningItem } from '../content/types';
import { recordAnswer, recordEvent } from '../database/repo';
import { useSettings } from '../state/settings';

export const ROUNDS = 8;

/**
 * Round bookkeeping shared by all games. No timers, no score penalties:
 * a wrong answer only plays a gentle "try again" and the child keeps trying.
 */
export function useGameSession(gameId: string, total = ROUNDS) {
  const { settings } = useSettings();
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [locked, setLocked] = useState(false);
  const wrongThisRound = useRef(false);
  const firstTry = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const correct = useCallback(
    (item?: LearningItem, afterClips: Clip[] = []) => {
      if (locked) return;
      setLocked(true);
      setCelebrate(true);
      if (!wrongThisRound.current) firstTry.current++;
      if (item) void recordAnswer(item.id, item.categoryId, true, gameId);
      void audio.play(`game:praise`, [...afterClips, randomPraise(settings.voice)]);
      timer.current = window.setTimeout(() => {
        setCelebrate(false);
        setLocked(false);
        wrongThisRound.current = false;
        setRound((r) => {
          if (r + 1 >= total) {
            setFinished(true);
            void recordEvent({ type: 'game', ref: gameId, detail: `done:${firstTry.current}/${total}` });
            void audio.play('game:done', [phraseClip('game-done', settings.voice)]);
            return r;
          }
          return r + 1;
        });
      }, 1700);
    },
    [gameId, locked, settings.voice, total],
  );

  const wrong = useCallback(
    (item?: LearningItem) => {
      if (locked) return;
      if (!wrongThisRound.current && item) void recordAnswer(item.id, item.categoryId, false, gameId);
      wrongThisRound.current = true;
      void audio.play('game:retry', [randomRetry(settings.voice)]);
    },
    [gameId, locked, settings.voice],
  );

  const restart = useCallback(() => {
    window.clearTimeout(timer.current);
    wrongThisRound.current = false;
    firstTry.current = 0;
    setCelebrate(false);
    setLocked(false);
    setFinished(false);
    setRound(0);
  }, []);

  return { round, finished, celebrate, locked, correct, wrong, restart, voice: settings.voice, level: settings.level, stars: firstTry.current, total };
}
