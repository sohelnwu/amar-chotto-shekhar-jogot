import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { db, type ProgressRow } from '../database/db';

/** Live progress rows keyed by item id. */
export function useProgressMap(): Map<string, ProgressRow> {
  const rows = useLiveQuery(() => db.progress.toArray(), [], []);
  return useMemo(() => new Map(rows.map((r) => [r.itemId, r])), [rows]);
}

export function useFavorites(): Set<string> {
  const rows = useLiveQuery(() => db.favorites.orderBy('addedAt').reverse().toArray(), [], []);
  return useMemo(() => new Set(rows.map((r) => r.itemId)), [rows]);
}

export function useFavoriteList(): string[] {
  return useLiveQuery(async () => (await db.favorites.orderBy('addedAt').reverse().toArray()).map((r) => r.itemId), [], []);
}

export function useRecent(limit = 12): ProgressRow[] {
  return useLiveQuery(() => db.progress.orderBy('lastSeen').reverse().filter((r) => r.views > 0).limit(limit).toArray(), [limit], []);
}
