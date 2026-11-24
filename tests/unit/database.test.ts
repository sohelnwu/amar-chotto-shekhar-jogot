import { beforeEach, describe, expect, it } from 'vitest';
import { db, DEFAULT_SETTINGS } from '../../src/database/db';
import { loadSettings, recordAnswer, recordView, resetProgress, saveSettings, toggleFavorite } from '../../src/database/repo';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('IndexedDB persistence', () => {
  it('stores and reloads settings with defaults for missing keys', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
    await saveSettings({ ...DEFAULT_SETTINGS, voice: 'male', level: 3, volume: 0.4 });
    const s = await loadSettings();
    expect(s.voice).toBe('male');
    expect(s.level).toBe(3);
    expect(s.volume).toBe(0.4);
  });

  it('counts views per item', async () => {
    await recordView('animals/cow', 'animals');
    await recordView('animals/cow', 'animals');
    const row = await db.progress.get('animals/cow');
    expect(row?.views).toBe(2);
    expect(await db.events.where('type').equals('view').count()).toBe(2);
  });

  it('records game answers', async () => {
    await recordAnswer('fruits/mango', 'fruits', false, 'listen');
    await recordAnswer('fruits/mango', 'fruits', true, 'listen');
    const row = await db.progress.get('fruits/mango');
    expect(row).toMatchObject({ correct: 1, wrong: 1, views: 0 });
  });

  it('toggles favorites', async () => {
    expect(await toggleFavorite('animals/cat')).toBe(true);
    expect(await db.favorites.count()).toBe(1);
    expect(await toggleFavorite('animals/cat')).toBe(false);
    expect(await db.favorites.count()).toBe(0);
  });

  it('reset clears progress and history but keeps favorites and settings', async () => {
    await recordView('animals/cow', 'animals');
    await toggleFavorite('animals/cow');
    await saveSettings({ ...DEFAULT_SETTINGS, voice: 'male' });
    await resetProgress();
    expect(await db.progress.count()).toBe(0);
    expect(await db.events.count()).toBe(0);
    expect(await db.favorites.count()).toBe(1);
    expect((await loadSettings()).voice).toBe('male');
  });
});
