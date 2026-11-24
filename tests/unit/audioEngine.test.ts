import { describe, expect, it, vi } from 'vitest';
import { AudioEngine } from '../../src/audio/AudioEngine';

/** Minimal HTMLAudioElement stand-in that "plays" for `ms` milliseconds. */
function fakeAudio(ms = 20, failPlay = false) {
  const log: string[] = [];
  let t: ReturnType<typeof setTimeout> | undefined;
  const el = {
    src: '',
    volume: 1,
    preload: '',
    onended: null as null | (() => void),
    onerror: null as null | (() => void),
    play: vi.fn(() => {
      log.push(`play:${el.src}`);
      if (failPlay) return Promise.reject(new Error('blocked'));
      t = setTimeout(() => el.onended?.(), ms);
      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      log.push('pause');
      if (t) clearTimeout(t);
    }),
    removeAttribute: vi.fn(),
  };
  return { el: el as unknown as HTMLAudioElement, log };
}

const manifest = { 'a.mp3': 1000, 'b.mp3': 1000 };
const resolveUrl = async (p: string) => `blob:${p}`;

describe('AudioEngine', () => {
  it('plays an existing file and returns to idle', async () => {
    const { el, log } = fakeAudio();
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    const states: string[] = [];
    eng.subscribe(() => states.push(eng.getState().status));
    expect(await eng.play('k', [{ src: 'a.mp3', lang: 'bn' }])).toBe(true);
    expect(log).toContain('play:blob:a.mp3');
    expect(states).toContain('playing');
    expect(eng.getState().status).toBe('idle');
  });

  it('reports "unavailable" (never pretends to play) when the file is missing and no TTS', async () => {
    const { el } = fakeAudio();
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    expect(await eng.play('k', [{ src: 'missing.mp3', text: 'আম', lang: 'bn' }])).toBe(false);
    expect(eng.getState().status).toBe('unavailable');
    expect(el.play).not.toHaveBeenCalled();
  });

  it('a new play() stops the previous clip (no overlapping audio)', async () => {
    const { el, log } = fakeAudio(200);
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    const first = eng.play('one', [{ src: 'a.mp3', lang: 'bn' }, { src: 'a.mp3', lang: 'bn' }]);
    await new Promise((r) => setTimeout(r, 10));
    const second = eng.play('two', [{ src: 'b.mp3', lang: 'bn' }]);
    await Promise.all([first, second]);
    // first sequence's second clip must never start after "two" began
    const idxTwo = log.indexOf('play:blob:b.mp3');
    expect(idxTwo).toBeGreaterThan(-1);
    expect(log.slice(idxTwo).filter((l) => l === 'play:blob:a.mp3')).toHaveLength(0);
    expect(el.pause).toHaveBeenCalled();
  });

  it('plays clips in sequence', async () => {
    const { el, log } = fakeAudio(5);
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    await eng.play('seq', [{ src: 'a.mp3', lang: 'bn' }, { src: 'b.mp3', lang: 'bn' }]);
    expect(log.filter((l) => l.startsWith('play'))).toEqual(['play:blob:a.mp3', 'play:blob:b.mp3']);
  });

  it('falls back to device TTS only when a voice for the language exists', async () => {
    const { el } = fakeAudio();
    const spoken: string[] = [];
    class Utt {
      text: string;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      voice: unknown;
      lang = '';
      rate = 1;
      volume = 1;
      constructor(t: string) {
        this.text = t;
      }
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Utt);
    const speech = {
      getVoices: () => [{ lang: 'en-US', name: 'en' }],
      speak: (u: Utt) => {
        spoken.push(u.text);
        setTimeout(() => u.onend?.(), 5);
      },
      cancel: vi.fn(),
    } as unknown as SpeechSynthesis;
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech });

    // no Bengali voice on this "device" -> unavailable, not wrong-language speech
    expect(await eng.play('bn', [{ src: 'x.mp3', text: 'আম', lang: 'bn' }])).toBe(false);
    expect(eng.getState().status).toBe('unavailable');

    // English voice exists -> TTS fallback is used
    expect(await eng.play('en', [{ src: 'x.mp3', text: 'Mango', lang: 'en' }])).toBe(true);
    expect(spoken).toEqual(['Mango']);

    // fallback can be switched off by the parent
    eng.ttsFallback = false;
    expect(await eng.play('en2', [{ src: 'x.mp3', text: 'Mango', lang: 'en' }])).toBe(false);
    vi.unstubAllGlobals();
  });

  it('falls back to TTS if file playback fails', async () => {
    const { el } = fakeAudio(5, true);
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    expect(await eng.play('k', [{ src: 'a.mp3', lang: 'bn' }])).toBe(false);
    expect(eng.getState().status).toBe('unavailable');
  });

  it('toggle pauses and resumes the same clip', async () => {
    const { el } = fakeAudio(500);
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    eng.toggle('k', [{ src: 'a.mp3', lang: 'bn' }]);
    await new Promise((r) => setTimeout(r, 20));
    expect(eng.getState().status).toBe('playing');
    eng.toggle('k', [{ src: 'a.mp3', lang: 'bn' }]);
    expect(eng.getState().status).toBe('paused');
    eng.toggle('k', [{ src: 'a.mp3', lang: 'bn' }]);
    expect(eng.getState().status).toBe('playing');
    eng.stop();
    expect(eng.getState().status).toBe('idle');
  });

  it('applies volume', () => {
    const { el } = fakeAudio();
    const eng = new AudioEngine({ manifest, createAudio: () => el, resolveUrl, speech: null });
    eng.setVolume(1.7);
    expect(eng.volume).toBe(1);
    eng.setVolume(0.3);
    expect(eng.volume).toBe(0.3);
  });
});
