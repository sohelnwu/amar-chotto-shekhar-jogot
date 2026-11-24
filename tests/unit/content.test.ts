import { describe, expect, it } from 'vitest';
import manifest from '../../src/content/audio-manifest.json';
import { categories, getItems, items, phraseAudio, phrases, visibleCategories } from '../../src/content';
import { validateContent } from '../../src/content/validate';

const files = (manifest as { files: Record<string, number> }).files;

describe('content data', () => {
  it('has no validation issues', () => {
    expect(validateContent()).toEqual([]);
  });

  it('has a useful amount of content', () => {
    expect(categories.length).toBeGreaterThanOrEqual(30);
    expect(items.length).toBeGreaterThanOrEqual(400);
  });

  it('every category has items at its minimum level', () => {
    for (const c of categories) expect(getItems(c.id, c.minLevel).length, c.id).toBeGreaterThan(0);
  });

  it('level filtering only ever adds content', () => {
    const l1 = visibleCategories(1).length;
    const l2 = visibleCategories(2).length;
    const l3 = visibleCategories(3).length;
    expect(l1).toBeLessThanOrEqual(l2);
    expect(l2).toBeLessThanOrEqual(l3);
    expect(getItems('animals', 1).length).toBeLessThan(getItems('animals', 3).length);
  });
});

describe('audio assets', () => {
  it('every item has Bengali name + description audio in both voices', () => {
    const missing: string[] = [];
    for (const it of items) {
      for (const g of ['female', 'male'] as const) {
        if (!(it.audio.nameBn[g] in files)) missing.push(it.audio.nameBn[g]);
        if (!(it.audio.descBn[g] in files)) missing.push(it.audio.descBn[g]);
        if (it.audio.nameEn && !(it.audio.nameEn[g] in files)) missing.push(it.audio.nameEn[g]);
        if (it.audio.descEn && !(it.audio.descEn[g] in files)) missing.push(it.audio.descEn[g]);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every app phrase has audio in both voices', () => {
    for (const key of Object.keys(phrases)) {
      expect(files[phraseAudio(key, 'female')], key).toBeGreaterThan(500);
      expect(files[phraseAudio(key, 'male')], key).toBeGreaterThan(500);
    }
  });

  it('English alphabet has English audio; Bengali letters do not need it', () => {
    expect(getItems('en-alphabet')[0].audio.nameEn).toBeDefined();
    expect(getItems('bn-vowels')[0].audio.nameEn).toBeUndefined();
  });
});
