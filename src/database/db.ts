import Dexie, { type EntityTable } from 'dexie';
import type { AgeLevel, VoiceGender } from '../content/types';

export interface Settings {
  voice: VoiceGender;
  volume: number; // 0..1
  level: AgeLevel;
  showEnglish: boolean;
  autoPlay: boolean;
  ttsFallback: boolean;
  screenTimeMinutes: 0 | 10 | 15 | 20 | 30 | 45;
  parentTheme: 'light' | 'dark';
  reduceMotion: boolean;
  downloadBothVoices: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  voice: 'female',
  volume: 0.9,
  level: 1,
  showEnglish: true,
  autoPlay: true,
  ttsFallback: true,
  screenTimeMinutes: 20,
  parentTheme: 'light',
  reduceMotion: false,
  downloadBothVoices: false,
};

export interface ProgressRow {
  itemId: string;
  categoryId: string;
  views: number;
  correct: number;
  wrong: number;
  firstSeen: number;
  lastSeen: number;
}

export interface FavoriteRow {
  itemId: string;
  addedAt: number;
}

export type EventType = 'view' | 'audio' | 'game';

export interface EventRow {
  id?: number;
  type: EventType;
  ref: string; // item id or game id
  ts: number;
  ok?: boolean;
  detail?: string;
}

export interface SettingsRow {
  key: 'app';
  value: Settings;
}

export class LearningDB extends Dexie {
  settings!: EntityTable<SettingsRow, 'key'>;
  progress!: EntityTable<ProgressRow, 'itemId'>;
  favorites!: EntityTable<FavoriteRow, 'itemId'>;
  events!: EntityTable<EventRow, 'id'>;

  constructor(name = 'amar-chotto-shekhar-jogot') {
    super(name);
    this.version(1).stores({
      settings: 'key',
      progress: 'itemId, categoryId, lastSeen',
      favorites: 'itemId, addedAt',
      events: '++id, type, ref, ts',
    });
  }
}

export const db = new LearningDB();
