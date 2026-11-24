import { db, DEFAULT_SETTINGS, type EventRow, type Settings } from './db';

const MAX_EVENTS = 2000;

export async function loadSettings(): Promise<Settings> {
  const row = await db.settings.get('app');
  return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
}

export async function saveSettings(value: Settings): Promise<void> {
  await db.settings.put({ key: 'app', value });
}

export async function recordView(itemId: string, categoryId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.progress, db.events, async () => {
    const row = await db.progress.get(itemId);
    if (row) {
      await db.progress.update(itemId, { views: row.views + 1, lastSeen: now });
    } else {
      await db.progress.add({ itemId, categoryId, views: 1, correct: 0, wrong: 0, firstSeen: now, lastSeen: now });
    }
    await db.events.add({ type: 'view', ref: itemId, ts: now });
  });
}

/** Records a game answer for an item (feeds "needs practice"). */
export async function recordAnswer(itemId: string, categoryId: string, ok: boolean, gameId: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.progress, db.events, async () => {
    const row = await db.progress.get(itemId);
    if (row) {
      await db.progress.update(itemId, ok ? { correct: row.correct + 1 } : { wrong: row.wrong + 1 });
    } else {
      await db.progress.add({
        itemId,
        categoryId,
        views: 0,
        correct: ok ? 1 : 0,
        wrong: ok ? 0 : 1,
        firstSeen: now,
        lastSeen: now,
      });
    }
    await db.events.add({ type: 'game', ref: gameId, ts: now, ok, detail: itemId });
  });
}

export async function recordEvent(e: Omit<EventRow, 'id' | 'ts'>): Promise<void> {
  await db.events.add({ ...e, ts: Date.now() });
  const count = await db.events.count();
  if (count > MAX_EVENTS) {
    const old = await db.events.orderBy('id').limit(count - MAX_EVENTS).primaryKeys();
    await db.events.bulkDelete(old);
  }
}

export async function toggleFavorite(itemId: string): Promise<boolean> {
  const exists = await db.favorites.get(itemId);
  if (exists) {
    await db.favorites.delete(itemId);
    return false;
  }
  await db.favorites.put({ itemId, addedAt: Date.now() });
  return true;
}

export async function resetProgress(): Promise<void> {
  await db.transaction('rw', db.progress, db.events, async () => {
    await db.progress.clear();
    await db.events.clear();
  });
}

export async function resetFavorites(): Promise<void> {
  await db.favorites.clear();
}
