import categoriesJson from './categories.json';
import phrasesJson from './phrases.json';
import type {
  AgeLevel,
  Category,
  CategoryKind,
  Group,
  LearningItem,
  Lang,
  Pack,
  RawCategory,
  RawItem,
  ShapeName,
  VoiceGender,
} from './types';

const itemFiles = import.meta.glob<Record<string, RawItem[]>>('./items/*.json', {
  eager: true,
  import: 'default',
});

const clampLevel = (n: number): AgeLevel => (n <= 1 ? 1 : n >= 3 ? 3 : 2) as AgeLevel;

function toCategory(raw: RawCategory): Category {
  const kind = (raw.kind ?? 'cards') as CategoryKind;
  const primaryLang = (raw.primaryLang ?? 'bn') as Lang;
  return {
    id: raw.id,
    group: raw.group,
    bengaliName: raw.bn,
    englishName: raw.en,
    emoji: raw.emoji,
    glyph: !!raw.glyph,
    color: raw.color,
    minLevel: clampLevel(raw.minLevel),
    kind,
    primaryLang,
    pack: raw.pack,
    // must match has_english_audio() in scripts/generate_audio.py
    hasEnglishAudio: !(kind === 'story' || (kind === 'letters' && primaryLang !== 'en')),
  };
}

const both = (fn: (g: VoiceGender) => string): Record<VoiceGender, string> => ({
  female: fn('female'),
  male: fn('male'),
});

function toItem(raw: RawItem, cat: Category): LearningItem {
  const base = `${cat.id}/${raw.id}`;
  const level = clampLevel(raw.level);
  return {
    id: base,
    localId: raw.id,
    categoryId: cat.id,
    bengaliName: raw.bn,
    englishName: raw.en,
    descriptionBn: raw.desc,
    descriptionEn: raw.descEn,
    emoji: raw.emoji,
    image: raw.image,
    symbol: raw.symbol,
    swatch: raw.swatch,
    shape: raw.shape as ShapeName | undefined,
    count: raw.count,
    ageLevel: level,
    difficulty: level,
    tags: raw.tags ?? [],
    relatedItems: (raw.related ?? []).map((r) => (r.includes('/') ? r : `${cat.id}/${r}`)),
    credit: raw.credit,
    audio: {
      nameBn: both((g) => `audio/bn/${g}/${base}.mp3`),
      descBn: both((g) => `audio/bn/${g}/${base}.desc.mp3`),
      nameEn: cat.hasEnglishAudio ? both((g) => `audio/en/${g}/${base}.mp3`) : undefined,
      descEn: cat.hasEnglishAudio && raw.descEn ? both((g) => `audio/en/${g}/${base}.desc.mp3`) : undefined,
      natural: raw.sound ? `sounds/${raw.sound}` : undefined,
    },
  };
}

export const groups: Group[] = categoriesJson.groups;
export const packs: Pack[] = categoriesJson.packs;
export const categories: Category[] = (categoriesJson.categories as RawCategory[]).map(toCategory);
export const categoryById = new Map(categories.map((c) => [c.id, c]));

const rawByCategory: Record<string, RawItem[]> = {};
for (const file of Object.values(itemFiles)) Object.assign(rawByCategory, file);

export const items: LearningItem[] = categories.flatMap((cat) =>
  (rawByCategory[cat.id] ?? []).map((raw) => toItem(raw, cat)),
);
export const itemById = new Map(items.map((i) => [i.id, i]));

const itemsByCategory = new Map<string, LearningItem[]>();
for (const it of items) {
  const list = itemsByCategory.get(it.categoryId) ?? [];
  list.push(it);
  itemsByCategory.set(it.categoryId, list);
}

export function getItems(categoryId: string, level: AgeLevel = 3): LearningItem[] {
  return (itemsByCategory.get(categoryId) ?? []).filter((i) => i.ageLevel <= level);
}

export function getAllItemsCount(categoryId: string): number {
  return itemsByCategory.get(categoryId)?.length ?? 0;
}

export function visibleCategories(level: AgeLevel): Category[] {
  return categories.filter((c) => c.minLevel <= level && getItems(c.id, level).length > 0);
}

export const phrases = phrasesJson as Record<string, string>;
export type PhraseKey = keyof typeof phrasesJson;
export const phraseAudio = (key: string, g: VoiceGender) => `audio/bn/${g}/phrases/${key}.mp3`;

/** Raw access for content validation and tests. */
export const __raw = { categoriesJson, rawByCategory };
