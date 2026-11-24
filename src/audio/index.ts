import { useSyncExternalStore } from 'react';
import manifestJson from '../content/audio-manifest.json';
import { phraseAudio, phrases } from '../content';
import type { LearningItem, VoiceGender } from '../content/types';
import { recordEvent } from '../database/repo';
import { AudioEngine, type Clip } from './AudioEngine';

export const audioManifest: Record<string, number> = (manifestJson as { files: Record<string, number> }).files;

export const audio = new AudioEngine({
  manifest: audioManifest,
  speech: typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null,
  onPlayed: (key, source) => {
    void recordEvent({ type: 'audio', ref: key, detail: source });
  },
});

export function useAudioState() {
  return useSyncExternalStore(audio.subscribe, audio.getState, audio.getState);
}

// ---------- clip builders ----------
export const nameBnClip = (it: LearningItem, v: VoiceGender): Clip => ({
  src: it.audio.nameBn[v],
  text: it.bengaliName,
  lang: 'bn',
});
export const descBnClip = (it: LearningItem, v: VoiceGender): Clip => ({
  src: it.audio.descBn[v],
  text: it.descriptionBn,
  lang: 'bn',
});
export const nameEnClip = (it: LearningItem, v: VoiceGender): Clip => ({
  src: it.audio.nameEn?.[v],
  text: it.englishName,
  lang: 'en',
});
export const descEnClip = (it: LearningItem, v: VoiceGender): Clip => ({
  src: it.audio.descEn?.[v],
  text: it.descriptionEn,
  lang: 'en',
});
export const phraseClip = (key: string, v: VoiceGender): Clip => ({
  src: phraseAudio(key, v),
  text: phrases[key],
  lang: 'bn',
});

/** The clip a tap on the item should play first (English for the English alphabet). */
export function primaryClip(it: LearningItem, v: VoiceGender, primaryLang: 'bn' | 'en'): Clip {
  return primaryLang === 'en' && it.audio.nameEn ? nameEnClip(it, v) : nameBnClip(it, v);
}

export function randomPraise(v: VoiceGender): Clip {
  return phraseClip(`praise-${1 + Math.floor(Math.random() * 5)}`, v);
}
export function randomRetry(v: VoiceGender): Clip {
  return phraseClip(`retry-${1 + Math.floor(Math.random() * 2)}`, v);
}

// Keep TTS voice list warm (Chrome loads voices asynchronously).
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}
