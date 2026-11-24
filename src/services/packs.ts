import { audioManifest } from '../audio';
import { AUDIO_CACHE, absoluteUrl } from '../audio/AudioEngine';
import { categories, packs } from '../content';
import type { VoiceGender } from '../content/types';

export interface PackStatus {
  packId: string;
  total: number;
  cached: number;
  bytesTotal: number;
  bytesCached: number;
}

const categoryPack = new Map(categories.map((c) => [c.id, c.pack]));

/** Which pack a manifest path belongs to, and which voice (null = voice independent). */
export function classifyPath(path: string): { pack: string; voice: VoiceGender | null } | null {
  const parts = path.split('/');
  // audio/<lang>/<voice>/<category|phrases>/<file>
  if (parts[0] === 'audio' && parts.length >= 5) {
    const voice = parts[2] as VoiceGender;
    const scope = parts[3];
    if (scope === 'phrases') return { pack: 'starter', voice };
    const pack = categoryPack.get(scope);
    return pack ? { pack, voice } : null;
  }
  // sounds/<category>/<file>
  if (parts[0] === 'sounds' && parts.length >= 3) {
    const pack = categoryPack.get(parts[1]);
    return pack ? { pack, voice: null } : null;
  }
  return null;
}

export function packFiles(packId: string, voices: VoiceGender[]): string[] {
  return Object.keys(audioManifest).filter((p) => {
    const c = classifyPath(p);
    return !!c && c.pack === packId && (c.voice === null || voices.includes(c.voice));
  });
}

async function cachedSet(): Promise<Set<string>> {
  if (typeof caches === 'undefined') return new Set();
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  return new Set(keys.map((r) => r.url));
}

export async function allPackStatus(voices: VoiceGender[]): Promise<PackStatus[]> {
  const have = await cachedSet();
  return packs.map((p) => {
    const files = packFiles(p.id, voices);
    let cached = 0;
    let bytesCached = 0;
    let bytesTotal = 0;
    for (const f of files) {
      const size = audioManifest[f] ?? 0;
      bytesTotal += size;
      if (have.has(absoluteUrl(f))) {
        cached++;
        bytesCached += size;
      }
    }
    return { packId: p.id, total: files.length, cached, bytesTotal, bytesCached };
  });
}

export async function downloadPack(
  packId: string,
  voices: VoiceGender[],
  onProgress: (done: number, total: number) => void,
  signal?: AbortSignal,
): Promise<{ ok: number; failed: number }> {
  if (typeof caches === 'undefined') throw new Error('Cache Storage not supported');
  await navigator.storage?.persist?.().catch(() => false);
  const cache = await caches.open(AUDIO_CACHE);
  const have = await cachedSet();
  const todo = packFiles(packId, voices).filter((f) => !have.has(absoluteUrl(f)));
  let done = 0;
  let failed = 0;
  onProgress(0, todo.length);
  const queue = [...todo];
  const worker = async () => {
    while (queue.length) {
      if (signal?.aborted) return;
      const path = queue.shift()!;
      const url = absoluteUrl(path);
      try {
        const res = await fetch(url, { signal });
        if (!res.ok) throw new Error(String(res.status));
        await cache.put(url, res);
      } catch {
        if (signal?.aborted) return;
        failed++;
      }
      done++;
      onProgress(done, todo.length);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return { ok: done - failed, failed };
}

export async function deletePack(packId: string): Promise<void> {
  if (typeof caches === 'undefined') return;
  const cache = await caches.open(AUDIO_CACHE);
  await Promise.all(packFiles(packId, ['female', 'male']).map((f) => cache.delete(absoluteUrl(f))));
}

export async function clearAudioCache(): Promise<void> {
  if (typeof caches === 'undefined') return;
  await caches.delete(AUDIO_CACHE);
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  const est = await navigator.storage?.estimate?.();
  return est ? { usage: est.usage ?? 0, quota: est.quota ?? 0 } : null;
}

export function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${toBn((n / 1024).toFixed(0))} KB`;
  return `${toBn((n / 1024 / 1024).toFixed(1))} MB`;
}

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export function toBn(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}
