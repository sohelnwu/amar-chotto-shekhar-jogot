import { describe, expect, it } from 'vitest';
import manifest from '../../src/content/audio-manifest.json';
import { packs } from '../../src/content';
import { classifyPath, formatBytes, packFiles, toBn } from '../../src/services/packs';

const files = Object.keys((manifest as { files: Record<string, number> }).files);

describe('content packs', () => {
  it('every audio file belongs to exactly one pack', () => {
    expect(files.filter((f) => classifyPath(f) === null)).toEqual([]);
    const both = packs.flatMap((p) => packFiles(p.id, ['female', 'male']));
    expect(both.length).toBe(files.length);
    expect(new Set(both).size).toBe(files.length);
  });

  it('single-voice download is about half of both voices', () => {
    for (const p of packs) {
      const f = packFiles(p.id, ['female']).length;
      const m = packFiles(p.id, ['male']).length;
      expect(f).toBe(m);
      expect(f + m).toBe(packFiles(p.id, ['female', 'male']).length);
    }
  });

  it('app phrases are in the essential starter pack', () => {
    expect(classifyPath('audio/bn/female/phrases/welcome.mp3')).toEqual({ pack: 'starter', voice: 'female' });
    expect(classifyPath('audio/bn/male/animals/cow.mp3')).toEqual({ pack: 'animals', voice: 'male' });
  });

  it('formats Bengali numbers', () => {
    expect(toBn(2025)).toBe('২০২৫');
    expect(formatBytes(3 * 1024 * 1024)).toBe('৩.০ MB');
  });
});
