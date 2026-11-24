import { useLiveQuery } from 'dexie-react-hooks';
import { BarChart3, Download, Heart, LogOut, Settings as SettingsIcon, ShieldCheck, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { audio, phraseClip } from '../audio';
import { OfflineBadge } from '../components/OfflineBadge';
import { ParentGate } from '../components/ParentGate';
import { categories, categoryById, getItems, itemById, packs } from '../content';
import type { VoiceGender } from '../content/types';
import { db, type Settings } from '../database/db';
import { resetFavorites, resetProgress, toggleFavorite } from '../database/repo';
import { GAMES } from '../games/catalog';
import { useProgressMap } from '../hooks/useLearning';
import { allPackStatus, clearAudioCache, deletePack, downloadPack, formatBytes, storageEstimate, toBn, type PackStatus } from '../services/packs';
import { useScreenTime } from '../state/screenTime';
import { useSettings } from '../state/settings';

const UNLOCK_KEY = 'acsj-parent-unlocked';
const UNLOCK_MS = 15 * 60 * 1000;

type Tab = 'summary' | 'settings' | 'downloads' | 'favorites';

export function ParentPage() {
  const [unlocked, setUnlocked] = useState(() => Date.now() - Number(sessionStorage.getItem(UNLOCK_KEY) ?? 0) < UNLOCK_MS);
  const [tab, setTab] = useState<Tab>('summary');
  const { settings } = useSettings();
  const dark = settings.parentTheme === 'dark';

  if (!unlocked) {
    return (
      <div className="bg-playful grid min-h-dvh place-items-center p-4">
        <div className="w-full">
          <ParentGate
            onPass={() => {
              sessionStorage.setItem(UNLOCK_KEY, String(Date.now()));
              setUnlocked(true);
            }}
          />
          <p className="mt-4 text-center">
            <Link to="/" className="text-ink-soft underline">
              হোমে ফিরে যান
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'summary', label: 'অগ্রগতি', icon: <BarChart3 className="size-5" /> },
    { id: 'settings', label: 'সেটিংস', icon: <SettingsIcon className="size-5" /> },
    { id: 'downloads', label: 'ডাউনলোড', icon: <Download className="size-5" /> },
    { id: 'favorites', label: 'প্রিয়', icon: <Heart className="size-5" /> },
  ];

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-dvh bg-slate-50 pb-16 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <header className="safe-top sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 pb-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <ShieldCheck className="size-7 shrink-0 text-grape" />
            <h1 className="flex-1 truncate text-lg font-bold sm:text-xl">অভিভাবক প্যানেল</h1>
            <span className="hidden sm:inline-flex">
              <OfflineBadge />
            </span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem(UNLOCK_KEY);
                setUnlocked(false);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
            >
              <LogOut className="size-4" /> লক
            </button>
            <Link to="/" className="shrink-0 rounded-full bg-grape px-4 py-2 text-sm font-semibold text-white">
              শিশুর পাতা
            </Link>
          </div>
          <nav className="mx-auto mt-3 flex max-w-4xl gap-1 overflow-x-auto" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                data-testid={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-semibold ${
                  tab === t.id ? 'bg-grape text-white' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-4xl space-y-4 px-4 pt-4">
          {tab === 'summary' && <SummaryTab />}
          {tab === 'settings' && <SettingsTab />}
          {tab === 'downloads' && <DownloadsTab />}
          {tab === 'favorites' && <FavoritesTab />}
        </main>
      </div>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
      <p className="text-2xl font-bold text-grape">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

// ------------------------------------------------------------------ Summary
function SummaryTab() {
  const { settings } = useSettings();
  const { todaySeconds, sessionSeconds } = useScreenTime();
  const progress = useProgressMap();
  const events = useLiveQuery(() => db.events.orderBy('id').reverse().limit(400).toArray(), [], []);
  const favCount = useLiveQuery(() => db.favorites.count(), [], 0);

  const seen = [...progress.values()].filter((p) => p.views > 0);
  const gamesDone = events.filter((e) => e.type === 'game' && e.detail?.startsWith('done')).length;
  const audioPlays = events.filter((e) => e.type === 'audio').length;
  const practice = [...progress.values()]
    .filter((p) => p.wrong > p.correct)
    .sort((a, b) => b.wrong - b.correct - (a.wrong - a.correct))
    .slice(0, 12);
  const history = events.filter((e) => e.type !== 'audio').slice(0, 25);

  return (
    <>
      <Card title="সারসংক্ষেপ">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="আজ ব্যবহার" value={`${toBn(Math.round(todaySeconds / 60))} মিনিট`} />
          <Stat label="এই সেশনে" value={`${toBn(Math.round(sessionSeconds / 60))} মিনিট`} />
          <Stat label="দেখা বিষয়বস্তু" value={toBn(seen.length)} />
          <Stat label="শেষ করা খেলা" value={toBn(gamesDone)} />
          <Stat label="অডিও শোনা (সাম্প্রতিক)" value={toBn(audioPlays)} />
          <Stat label="প্রিয়" value={toBn(favCount)} />
        </div>
      </Card>

      <Card title={`বিষয়ভিত্তিক অগ্রগতি (লেভেল ${toBn(settings.level)})`}>
        <ul className="space-y-2" data-testid="category-progress">
          {categories.map((c) => {
            const list = getItems(c.id, settings.level);
            if (!list.length || c.minLevel > settings.level) return null;
            const n = list.filter((i) => (progress.get(i.id)?.views ?? 0) > 0).length;
            const pct = Math.round((n / list.length) * 100);
            return (
              <li key={c.id} className="flex items-center gap-3">
                <span className="w-36 truncate text-sm sm:w-48">{c.bengaliName}</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                </span>
                <span className="w-16 text-right text-sm tabular-nums">
                  {toBn(n)}/{toBn(list.length)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="আবার অনুশীলন দরকার">
        {practice.length === 0 ? (
          <p className="text-slate-500">এখনও কিছু নেই। খেলায় যেগুলোতে বেশি ভুল হবে, সেগুলো এখানে দেখাবে।</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {practice.map((p) => {
              const it = itemById.get(p.itemId);
              if (!it) return null;
              return (
                <Link key={p.itemId} to={`/c/${it.categoryId}/${it.localId}`} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-sm dark:bg-slate-700">
                  <span className="emoji">{it.emoji ?? it.symbol}</span> {it.bengaliName}
                  <span className="text-xs text-slate-500">({toBn(p.correct)}✓ {toBn(p.wrong)}✗)</span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="সাম্প্রতিক কার্যকলাপ">
        {history.length === 0 ? (
          <p className="text-slate-500">এখনও কোনো কার্যকলাপ নেই।</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
            {history.map((e) => {
              const it = e.type === 'view' ? itemById.get(e.ref) : e.detail && !e.detail.startsWith('done') ? itemById.get(e.detail) : undefined;
              const game = e.type === 'game' ? GAMES.find((g) => g.id === e.ref) : undefined;
              return (
                <li key={e.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {e.type === 'view' && `দেখেছে: ${it?.bengaliName ?? e.ref}`}
                    {e.type === 'game' &&
                      (e.detail?.startsWith('done')
                        ? `খেলা শেষ: ${game?.bn ?? e.ref}`
                        : `${game?.bn ?? e.ref}: ${it?.bengaliName ?? ''} ${e.ok ? '✓' : '✗'}`)}
                  </span>
                  <span className="shrink-0 text-slate-400">{new Date(e.ts).toLocaleString('bn-BD', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Settings
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-slate-700">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, testId }: { value: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      data-testid={testId}
      onClick={() => onChange(!value)}
      className={`relative h-8 w-14 rounded-full transition ${value ? 'bg-grape' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${value ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function Segmented<T extends string | number>({ value, options, onChange, testId }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="inline-flex flex-wrap rounded-full bg-slate-100 p-1 dark:bg-slate-900" role="radiogroup" data-testid={testId}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${value === o.v ? 'bg-white text-grape shadow dark:bg-slate-700 dark:text-white' : 'text-slate-500'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SettingsTab() {
  const { settings, update } = useSettings();
  const set = <K extends keyof Settings>(k: K) => (v: Settings[K]) => update({ [k]: v } as Partial<Settings>);
  const bnTts = audio.ttsVoice('bn');
  return (
    <>
      <Card title="কণ্ঠ ও শব্দ">
        <Row label="কণ্ঠ" hint="শিশু কার্ডেও আপু/ভাইয়া বদলাতে পারে">
          <Segmented<VoiceGender>
            testId="setting-voice"
            value={settings.voice}
            onChange={set('voice')}
            options={[
              { v: 'female', label: '👩 নারী কণ্ঠ' },
              { v: 'male', label: '👨 পুরুষ কণ্ঠ' },
            ]}
          />
        </Row>
        <Row label={`ভলিউম: ${toBn(Math.round(settings.volume * 100))}%`}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.volume * 100)}
              onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
              className="w-40 accent-grape"
              aria-label="ভলিউম"
            />
            <button type="button" onClick={() => void audio.play('test', [phraseClip('praise-2', settings.voice)])} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-700">
              পরীক্ষা
            </button>
          </div>
        </Row>
        <Row label="কার্ড খুললেই নাম শোনাবে">
          <Toggle value={settings.autoPlay} onChange={set('autoPlay')} />
        </Row>
        <Row
          label="ডিভাইসের TTS বিকল্প"
          hint={
            bnTts
              ? `অডিও ফাইল না থাকলে ফোনের কণ্ঠ (${bnTts.name}) ব্যবহার হবে।`
              : 'এই ডিভাইসে বাংলা TTS কণ্ঠ পাওয়া যায়নি; ফাইল না থাকলে "অডিও নেই" দেখাবে।'
          }
        >
          <Toggle value={settings.ttsFallback} onChange={set('ttsFallback')} />
        </Row>
      </Card>

      <Card title="শেখা">
        <Row label="বয়সভিত্তিক লেভেল" hint="লেভেল বাড়ালে নতুন বিষয় ও কঠিন খেলা খুলে যায়">
          <Segmented
            testId="setting-level"
            value={settings.level}
            onChange={set('level')}
            options={[
              { v: 1 as const, label: '৩–৪ বছর' },
              { v: 2 as const, label: '৪–৫ বছর' },
              { v: 3 as const, label: '৫–৬ বছর' },
            ]}
          />
        </Row>
        <Row label="ইংরেজি নাম দেখাবে">
          <Toggle value={settings.showEnglish} onChange={set('showEnglish')} />
        </Row>
        <Row label="কম অ্যানিমেশন" hint="চোখের আরাম বা পুরোনো ফোনের জন্য">
          <Toggle value={settings.reduceMotion} onChange={set('reduceMotion')} />
        </Row>
      </Card>

      <Card title="স্ক্রিন টাইম">
        <Row label="বিশ্রামের মনে করিয়ে দেওয়া" hint="সময় শেষ হলে বিশ্রামের পাতা আসবে; অভিভাবক ছাড়া চালু করা যাবে না">
          <Segmented
            testId="setting-screentime"
            value={settings.screenTimeMinutes}
            onChange={set('screenTimeMinutes')}
            options={[
              { v: 0 as const, label: 'বন্ধ' },
              { v: 10 as const, label: '১০ মি.' },
              { v: 20 as const, label: '২০ মি.' },
              { v: 30 as const, label: '৩০ মি.' },
              { v: 45 as const, label: '৪৫ মি.' },
            ]}
          />
        </Row>
      </Card>

      <Card title="অভিভাবক প্যানেল">
        <Row label="ডার্ক থিম">
          <Toggle value={settings.parentTheme === 'dark'} onChange={(v) => update({ parentTheme: v ? 'dark' : 'light' })} />
        </Row>
      </Card>

      <DataCard />
    </>
  );
}

function DataCard() {
  const [confirm, setConfirm] = useState<'progress' | 'favorites' | null>(null);
  const [done, setDone] = useState('');
  return (
    <Card title="তথ্য ও গোপনীয়তা">
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        সব তথ্য শুধু এই ফোনেই থাকে। অ্যাপ কোনো ব্যক্তিগত তথ্য, অবস্থান বা বিজ্ঞাপন-ট্র্যাকিং সংগ্রহ করে না, কোথাও পাঠায় না।
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="reset-progress" onClick={() => setConfirm('progress')} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 font-semibold text-red-600 dark:bg-red-950">
          <Trash2 className="size-4" /> অগ্রগতি মুছুন
        </button>
        <button type="button" onClick={() => setConfirm('favorites')} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 font-semibold text-red-600 dark:bg-red-950">
          <Trash2 className="size-4" /> প্রিয় তালিকা মুছুন
        </button>
      </div>
      {confirm && (
        <div className="mt-3 rounded-2xl bg-red-50 p-4 dark:bg-red-950" role="alertdialog">
          <p className="font-semibold">{confirm === 'progress' ? 'সব অগ্রগতি ও কার্যকলাপের ইতিহাস মুছে যাবে।' : 'সব প্রিয় আইটেম মুছে যাবে।'} এটা ফেরত আনা যাবে না।</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              data-testid="confirm-reset"
              onClick={async () => {
                if (confirm === 'progress') await resetProgress();
                else await resetFavorites();
                setDone(confirm === 'progress' ? 'অগ্রগতি মুছে ফেলা হয়েছে।' : 'প্রিয় তালিকা মুছে ফেলা হয়েছে।');
                setConfirm(null);
              }}
              className="rounded-full bg-red-600 px-4 py-2 font-semibold text-white"
            >
              হ্যাঁ, মুছুন
            </button>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-full bg-white px-4 py-2 dark:bg-slate-800">
              বাতিল
            </button>
          </div>
        </div>
      )}
      {done && <p className="mt-3 text-sm text-leaf" role="status">{done}</p>}
    </Card>
  );
}

// ------------------------------------------------------------------ Downloads
function DownloadsTab() {
  const { settings, update } = useSettings();
  const voices: VoiceGender[] = useMemo(() => (settings.downloadBothVoices ? ['female', 'male'] : [settings.voice]), [settings.downloadBothVoices, settings.voice]);
  const [status, setStatus] = useState<PackStatus[]>([]);
  const [busy, setBusy] = useState<Record<string, { done: number; total: number }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const aborts = useRef<Record<string, AbortController>>({});

  const refresh = useCallback(async () => {
    setStatus(await allPackStatus(voices));
    setStorage(await storageEstimate());
  }, [voices]);
  useEffect(() => {
    void refresh();
    const ctl = aborts.current;
    return () => Object.values(ctl).forEach((a) => a.abort());
  }, [refresh]);

  const start = async (packId: string) => {
    const ctl = new AbortController();
    aborts.current[packId] = ctl;
    setErrors((e) => ({ ...e, [packId]: '' }));
    setBusy((b) => ({ ...b, [packId]: { done: 0, total: 1 } }));
    try {
      const res = await downloadPack(packId, voices, (done, total) => setBusy((b) => ({ ...b, [packId]: { done, total } })), ctl.signal);
      if (res.failed) setErrors((e) => ({ ...e, [packId]: `${toBn(res.failed)}টি ফাইল নামানো যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন।` }));
    } catch {
      setErrors((e) => ({ ...e, [packId]: 'ডাউনলোড করা যায়নি।' }));
    }
    delete aborts.current[packId];
    setBusy((b) => {
      const n = { ...b };
      delete n[packId];
      return n;
    });
    void refresh();
  };

  const totalAll = status.reduce((s, p) => s + p.bytesTotal, 0);
  const cachedAll = status.reduce((s, p) => s + p.bytesCached, 0);

  return (
    <>
      <Card title="অফলাইন অডিও প্যাক">
        <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
          অ্যাপের পাতা, ছবি ও লেখা ইনস্টলের সময়ই অফলাইনে রাখা হয়। অডিও আলাদা প্যাকে — যে প্যাক ডাউনলোড করবেন, ইন্টারনেট ছাড়াও তার সব শব্দ চলবে।
          অনলাইনে কোনো অডিও একবার শুনলে সেটাও জমা থাকে।
        </p>
        <Row label="দুই কণ্ঠই ডাউনলোড" hint={settings.downloadBothVoices ? 'নারী ও পুরুষ দুই কণ্ঠ' : `শুধু বর্তমান কণ্ঠ (${settings.voice === 'female' ? 'নারী' : 'পুরুষ'})`}>
          <Toggle value={settings.downloadBothVoices} onChange={(v) => update({ downloadBothVoices: v })} />
        </Row>
        <ul className="mt-2 space-y-3" data-testid="packs">
          {packs.map((p) => {
            const st = status.find((s) => s.packId === p.id);
            const b = busy[p.id];
            const complete = !!st && st.total > 0 && st.cached === st.total;
            const pct = b ? Math.round((b.done / Math.max(1, b.total)) * 100) : st && st.total ? Math.round((st.cached / st.total) * 100) : 0;
            return (
              <li key={p.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900" data-testid={`pack-${p.id}`} data-complete={complete ? 'yes' : 'no'}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {p.bn} {p.essential && <span className="ml-1 rounded-full bg-sun/30 px-2 py-0.5 text-xs">প্রয়োজনীয়</span>}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {p.desc} · {st ? `${toBn(st.total)}টি ফাইল, ${formatBytes(st.bytesTotal)}` : '…'}
                    </p>
                  </div>
                  {b ? (
                    <button type="button" onClick={() => aborts.current[p.id]?.abort()} className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold dark:bg-slate-700">
                      থামান
                    </button>
                  ) : complete ? (
                    <button type="button" onClick={() => void deletePack(p.id).then(refresh)} className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-600 dark:bg-slate-800">
                      <Trash2 className="size-4" /> মুছুন
                    </button>
                  ) : (
                    <button
                      type="button"
                      data-testid={`download-${p.id}`}
                      disabled={!st || st.total === 0 || !navigator.onLine}
                      onClick={() => void start(p.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-grape px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                    >
                      <Download className="size-4" /> {st && st.cached > 0 ? 'বাকিটা নামান' : 'ডাউনলোড'}
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <span className={`block h-full rounded-full ${complete ? 'bg-leaf' : 'bg-grape'}`} style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-28 text-right text-xs tabular-nums text-slate-500">
                    {b ? `${toBn(b.done)}/${toBn(b.total)}` : complete ? 'অফলাইনে আছে ✓' : `${toBn(pct)}%`}
                  </span>
                </div>
                {errors[p.id] && <p className="mt-2 text-sm text-red-600">{errors[p.id]}</p>}
              </li>
            );
          })}
        </ul>
        {!navigator.onLine && <p className="mt-3 text-sm text-amber-600">ডাউনলোডের জন্য ইন্টারনেট সংযোগ দরকার।</p>}
      </Card>

      <Card title="স্টোরেজ">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="ডাউনলোড করা অডিও" value={`${formatBytes(cachedAll)} / ${formatBytes(totalAll)}`} />
          <Stat label="অ্যাপের মোট ব্যবহার" value={storage ? formatBytes(storage.usage) : 'জানা যায়নি'} />
        </div>
        <button
          type="button"
          onClick={() => void clearAudioCache().then(refresh)}
          className="mt-4 inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 font-semibold text-red-600 dark:bg-red-950"
        >
          <Trash2 className="size-4" /> সব অডিও ক্যাশ মুছুন
        </button>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------ Favorites
function FavoritesTab() {
  const favs = useLiveQuery(() => db.favorites.orderBy('addedAt').reverse().toArray(), [], []);
  return (
    <Card title="শিশুর প্রিয় বিষয়">
      {favs.length === 0 ? (
        <p className="text-slate-500">এখনও কিছু প্রিয় তালিকায় নেই।</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {favs.map((f) => {
            const it = itemById.get(f.itemId);
            if (!it) return null;
            return (
              <li key={f.itemId} className="flex items-center gap-3 py-2">
                <span className="emoji w-10 text-center text-2xl">{it.emoji ?? it.symbol}</span>
                <span className="flex-1">
                  {it.bengaliName} <span className="text-sm text-slate-500">· {categoryById.get(it.categoryId)?.bengaliName}</span>
                </span>
                <button type="button" onClick={() => void toggleFavorite(f.itemId)} className="rounded-full p-2 text-red-500" aria-label="সরান">
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
