export type AgeLevel = 1 | 2 | 3;
export type Lang = 'bn' | 'en';
export type VoiceGender = 'female' | 'male';
export type CategoryKind = 'cards' | 'letters' | 'numbers' | 'colors' | 'shapes' | 'story';
export type ShapeName = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart' | 'oval' | 'diamond';

export interface Group {
  id: string;
  bn: string;
  en: string;
  emoji: string;
}

export interface Pack {
  id: string;
  bn: string;
  en: string;
  desc: string;
  essential?: boolean;
}

export interface Category {
  id: string;
  group: string;
  bengaliName: string;
  englishName: string;
  emoji: string;
  /** emoji field holds a text glyph (letter/number) rather than an emoji */
  glyph: boolean;
  color: string;
  minLevel: AgeLevel;
  kind: CategoryKind;
  primaryLang: Lang;
  pack: string;
  hasEnglishAudio: boolean;
}

/** Fully-resolved learning item used across the app. */
export interface LearningItem {
  /** global id: "<categoryId>/<localId>" */
  id: string;
  localId: string;
  categoryId: string;
  bengaliName: string;
  englishName: string;
  descriptionBn: string;
  descriptionEn?: string;
  emoji?: string;
  /** optional licensed photo/illustration under /public/images */
  image?: string;
  /** big text glyph for letters / numbers */
  symbol?: string;
  swatch?: string;
  shape?: ShapeName;
  count?: number;
  ageLevel: AgeLevel;
  difficulty: AgeLevel;
  tags: string[];
  relatedItems: string[];
  credit?: string;
  /** audio paths (relative to app root); availability is checked against the manifest */
  audio: {
    nameBn: Record<VoiceGender, string>;
    descBn: Record<VoiceGender, string>;
    nameEn?: Record<VoiceGender, string>;
    descEn?: Record<VoiceGender, string>;
    natural?: string;
  };
}

/** Raw JSON item shape (see README "Content format"). */
export interface RawItem {
  id: string;
  bn: string;
  en: string;
  desc: string;
  level: number;
  emoji?: string;
  image?: string;
  symbol?: string;
  sayBn?: string;
  sayEn?: string;
  descEn?: string;
  swatch?: string;
  shape?: string;
  count?: number;
  tags?: string[];
  related?: string[];
  credit?: string;
  sound?: string;
}

export interface RawCategory {
  id: string;
  group: string;
  bn: string;
  en: string;
  emoji: string;
  glyph?: boolean;
  color: string;
  minLevel: number;
  kind?: string;
  primaryLang?: string;
  pack: string;
}
