import type { Lang } from '../content/types';

export const AUDIO_CACHE = 'acsj-audio-v1';

export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'unavailable' | 'error';
export type AudioSource = 'file' | 'tts' | null;

export interface Clip {
  /** path relative to the app root, e.g. "audio/bn/female/animals/cow.mp3" */
  src?: string;
  /** text spoken by device TTS if the file is missing and fallback is allowed */
  text?: string;
  lang: Lang;
}

export interface AudioState {
  status: AudioStatus;
  key: string | null;
  source: AudioSource;
  message?: string;
}

export interface EngineDeps {
  manifest: Record<string, number>;
  createAudio?: () => HTMLAudioElement;
  /** resolves a clip path to a playable URL (blob URL), or throws */
  resolveUrl?: (path: string) => Promise<string>;
  speech?: SpeechSynthesis | null;
  onPlayed?: (key: string, source: Exclude<AudioSource, null>) => void;
}

const IDLE: AudioState = { status: 'idle', key: null, source: null };

/**
 * Centralised audio engine.
 * - one HTMLAudioElement for the whole app => clips never overlap
 * - every play() cancels whatever was playing before (token based)
 * - files are read from the Cache Storage first (offline packs), then network,
 *   and are added to the cache after a successful network fetch
 * - device TTS is used only when the file is missing AND a voice for that
 *   language exists on the device; otherwise the state is "unavailable"
 */
export class AudioEngine {
  private deps: EngineDeps;
  private el: HTMLAudioElement | null = null;
  private token = 0;
  private state: AudioState = IDLE;
  private listeners = new Set<() => void>();
  private urlCache = new Map<string, string>();
  private finishCurrent: (() => void) | null = null;
  private lastClips: Clip[] = [];
  volume = 0.9;
  ttsFallback = true;

  constructor(deps: EngineDeps) {
    this.deps = deps;
  }

  // ---------- state ----------
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  getState = () => this.state;
  private set(next: AudioState) {
    this.state = next;
    this.listeners.forEach((l) => l());
  }

  has(path?: string): boolean {
    return !!path && path in this.deps.manifest;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.el) this.el.volume = this.volume;
  }

  /** Can this clip be heard at all (file exists, or TTS fallback can speak it)? */
  canPlay(clip: Clip): boolean {
    return this.has(clip.src) || (!!clip.text && this.ttsFallback && !!this.ttsVoice(clip.lang));
  }

  // ---------- controls ----------
  async play(key: string, clips: Clip[]): Promise<boolean> {
    this.stopInternal();
    const my = ++this.token;
    this.lastClips = clips;
    let playedAny = false;
    let lastSource: AudioSource = null;

    for (const clip of clips) {
      if (my !== this.token) return playedAny;
      let ok = false;
      if (this.has(clip.src)) {
        this.set({ status: 'loading', key, source: 'file' });
        ok = await this.playFile(clip.src!, key, my);
        if (ok) lastSource = 'file';
      }
      if (!ok && my === this.token && clip.text && this.ttsFallback && this.ttsVoice(clip.lang)) {
        ok = await this.playTts(clip, key, my);
        if (ok) lastSource = 'tts';
      }
      playedAny ||= ok;
    }

    if (my !== this.token) return playedAny;
    if (playedAny) {
      this.set(IDLE);
      if (lastSource) this.deps.onPlayed?.(key, lastSource);
    } else {
      this.set({
        status: 'unavailable',
        key,
        source: null,
        message: 'এই অডিওটি এখন নেই। অভিভাবক সেটিংস থেকে অডিও প্যাক ডাউনলোড করুন।',
      });
    }
    return playedAny;
  }

  /** Same key: pause / resume. Different key: play. */
  toggle(key: string, clips: Clip[]) {
    if (this.state.key === key && this.state.status === 'playing' && this.state.source === 'file') {
      this.pause();
    } else if (this.state.key === key && this.state.status === 'paused') {
      this.resume();
    } else {
      void this.play(key, clips);
    }
  }

  replay() {
    if (this.state.key && this.lastClips.length) void this.play(this.state.key, this.lastClips);
  }

  pause() {
    if (this.el && this.state.status === 'playing' && this.state.source === 'file') {
      this.el.pause();
      this.set({ ...this.state, status: 'paused' });
    } else if (this.state.source === 'tts') {
      this.stop();
    }
  }

  resume() {
    if (this.el && this.state.status === 'paused') {
      void this.el.play().catch(() => this.stop());
      this.set({ ...this.state, status: 'playing' });
    }
  }

  stop() {
    this.token++;
    this.stopInternal();
    this.set(IDLE);
  }

  private stopInternal() {
    if (this.el) {
      this.el.pause();
      this.el.removeAttribute('src');
    }
    this.deps.speech?.cancel();
    const f = this.finishCurrent;
    this.finishCurrent = null;
    f?.();
  }

  // ---------- file playback ----------
  private audioEl(): HTMLAudioElement {
    if (!this.el) {
      this.el = this.deps.createAudio ? this.deps.createAudio() : new Audio();
      this.el.preload = 'auto';
    }
    return this.el;
  }

  private async playFile(path: string, key: string, my: number): Promise<boolean> {
    let url: string;
    try {
      url = await this.getUrl(path);
    } catch {
      return false;
    }
    if (my !== this.token) return false;
    const el = this.audioEl();
    el.volume = this.volume;
    el.src = url;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        el.onended = null;
        el.onerror = null;
        if (this.finishCurrent === finish) this.finishCurrent = null;
        resolve(ok);
      };
      const finish = () => done(true);
      this.finishCurrent = finish;
      el.onended = () => done(true);
      el.onerror = () => done(false);
      el.play().then(
        () => {
          if (my === this.token) this.set({ status: 'playing', key, source: 'file' });
        },
        () => done(false),
      );
    });
  }

  private pending = new Map<string, Promise<string>>();

  private async getUrl(path: string): Promise<string> {
    const cached = this.urlCache.get(path);
    if (cached) return cached;
    let p = this.pending.get(path);
    if (!p) {
      p = (this.deps.resolveUrl ?? defaultResolveUrl)(path).finally(() => this.pending.delete(path));
      this.pending.set(path, p);
    }
    const url = await p;
    if (this.urlCache.has(path)) return this.urlCache.get(path)!;
    this.urlCache.set(path, url);
    if (this.urlCache.size > 80) {
      const [oldPath, oldUrl] = this.urlCache.entries().next().value as [string, string];
      this.urlCache.delete(oldPath);
      if (oldUrl.startsWith('blob:')) URL.revokeObjectURL(oldUrl);
    }
    return url;
  }

  // ---------- TTS fallback ----------
  ttsVoice(lang: Lang): SpeechSynthesisVoice | null {
    const sp = this.deps.speech;
    if (!sp) return null;
    const voices = sp.getVoices();
    const prefix = lang === 'bn' ? 'bn' : 'en';
    return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ?? null;
  }

  private playTts(clip: Clip, key: string, my: number): Promise<boolean> {
    const sp = this.deps.speech!;
    const voice = this.ttsVoice(clip.lang);
    if (!voice || !clip.text) return Promise.resolve(false);
    return new Promise<boolean>((resolve) => {
      const u = new SpeechSynthesisUtterance(clip.text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = 0.85;
      u.volume = this.volume;
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        if (this.finishCurrent === finish) this.finishCurrent = null;
        resolve(ok);
      };
      const finish = () => done(true);
      this.finishCurrent = finish;
      u.onend = () => done(true);
      u.onerror = () => done(false);
      if (my === this.token) this.set({ status: 'playing', key, source: 'tts' });
      sp.speak(u);
    });
  }
}

export function absoluteUrl(path: string): string {
  return new URL(path, document.baseURI).href;
}

/** Cache Storage first, then network (and store the response for offline use). */
export async function defaultResolveUrl(path: string): Promise<string> {
  const url = absoluteUrl(path);
  let res: Response | undefined;
  const cache = typeof caches !== 'undefined' ? await caches.open(AUDIO_CACHE).catch(() => undefined) : undefined;
  res = await cache?.match(url);
  if (!res) {
    const net = await fetch(url);
    if (!net.ok) throw new Error(`HTTP ${net.status}`);
    await cache?.put(url, net.clone()).catch(() => undefined);
    res = net;
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
