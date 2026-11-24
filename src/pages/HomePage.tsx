import { motion } from 'framer-motion';
import { Gamepad2, Heart, Lock, Sparkles, Volume2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { audio, phraseClip, primaryClip } from '../audio';
import { CategoryCard } from '../components/Cards';
import { ItemVisual } from '../components/ItemVisual';
import { Mascot } from '../components/Mascot';
import { OfflineBadge } from '../components/OfflineBadge';
import { categoryById, getItems, groups, itemById, visibleCategories } from '../content';
import type { LearningItem } from '../content/types';
import { useFavoriteList, useProgressMap, useRecent } from '../hooks/useLearning';
import { useSettings } from '../state/settings';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'শুভ রাত্রি';
  if (h < 12) return 'শুভ সকাল';
  if (h < 16) return 'শুভ দুপুর';
  if (h < 19) return 'শুভ বিকাল';
  return 'শুভ সন্ধ্যা';
}

/** Same item for the whole day, changes daily. */
function dailyItem(level: 1 | 2 | 3): LearningItem | undefined {
  const pool = visibleCategories(level)
    .filter((c) => c.kind === 'cards')
    .flatMap((c) => getItems(c.id, level));
  if (!pool.length) return undefined;
  const d = new Date();
  const seed = d.getFullYear() * 1000 + Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[(seed * 9301 + 49297) % pool.length];
}

export function HomePage() {
  const { settings } = useSettings();
  const progress = useProgressMap();
  const recent = useRecent(12);
  const favorites = useFavoriteList();
  const cats = visibleCategories(settings.level);
  const daily = dailyItem(settings.level);
  const lastCat = recent[0] ? categoryById.get(recent[0].categoryId) : undefined;

  const catProgress = (id: string) => {
    const list = getItems(id, settings.level);
    if (!list.length) return 0;
    return list.filter((i) => (progress.get(i.id)?.views ?? 0) > 0).length / list.length;
  };

  return (
    <div className="bg-playful child-area min-h-dvh pb-16">
      <header className="safe-top px-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
          <OfflineBadge />
          <Link
            to="/parent"
            data-testid="parent-entry"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-ink-soft shadow-soft"
          >
            <Lock className="size-4" /> অভিভাবক
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Welcome */}
        <section className="mt-3 flex items-center gap-2 rounded-4xl bg-gradient-to-br from-grape to-sky p-4 text-white shadow-soft sm:gap-3 sm:p-7">
          <Mascot className="size-20 shrink-0 sm:size-32" />
          <div className="min-w-0 flex-1">
            <p className="text-lg opacity-90">{greeting()}!</p>
            <h1 className="text-2xl font-bold leading-tight sm:text-4xl">আমার ছোট্ট শেখার জগৎ</h1>
            <p className="mt-1 opacity-90">চলো, আজ নতুন কিছু শিখি ✨</p>
          </div>
          <button
            type="button"
            aria-label="স্বাগত বার্তা শোনো"
            onClick={() => audio.toggle('phrase:welcome', [phraseClip('welcome', settings.voice)])}
            className="pressable grid size-12 shrink-0 place-items-center rounded-full bg-white/25 sm:size-16"
          >
            <Volume2 className="size-6 sm:size-8" />
          </button>
        </section>

        {/* Quick row: games, continue, daily */}
        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <Link to="/games" data-testid="games-entry" className="pressable flex items-center gap-4 rounded-4xl p-4 sm:p-5 bg-gradient-to-br from-coral to-sun text-white shadow-pop">
            <span className="grid size-16 place-items-center rounded-3xl bg-white/25">
              <Gamepad2 className="size-9" />
            </span>
            <span>
              <span className="block text-2xl font-bold">খেলি ও শিখি</span>
              <span className="text-sm opacity-90">মজার খেলা</span>
            </span>
          </Link>

          {lastCat ? (
            <Link to={`/c/${lastCat.id}`} className="pressable flex items-center gap-4 rounded-4xl p-4 sm:p-5 bg-white shadow-pop">
              <span className={`grid size-16 place-items-center rounded-3xl ${lastCat.glyph ? 'text-3xl font-bold' : 'emoji text-4xl'}`} style={{ background: `${lastCat.color}22`, color: lastCat.color }}>
                {lastCat.emoji}
              </span>
              <span>
                <span className="block text-sm text-ink-soft">আবার শুরু করো</span>
                <span className="block text-2xl font-bold">{lastCat.bengaliName}</span>
              </span>
            </Link>
          ) : (
            <Link to="/c/bn-vowels" className="pressable flex items-center gap-4 rounded-4xl p-4 sm:p-5 bg-white shadow-pop">
              <span className="grid size-16 place-items-center rounded-3xl bg-coral/15 text-3xl font-bold text-coral">অ</span>
              <span>
                <span className="block text-sm text-ink-soft">শুরু করো</span>
                <span className="block text-2xl font-bold">স্বরবর্ণ</span>
              </span>
            </Link>
          )}

          {daily && (
            <button
              type="button"
              data-testid="daily"
              onClick={() => audio.toggle(`daily:${daily.id}`, [primaryClip(daily, settings.voice, 'bn')])}
              className="pressable flex items-center gap-4 rounded-4xl p-4 sm:p-5 bg-white text-left shadow-pop"
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-sun/20">
                <ItemVisual item={daily} size="sm" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm text-ink-soft">
                  <Sparkles className="size-4 text-sun" /> আজকের নতুন
                </span>
                <span className="block truncate text-2xl font-bold">{daily.bengaliName}</span>
              </span>
            </button>
          )}
        </section>

        {favorites.length > 0 && (
          <MiniRow title="আমার প্রিয়" icon={<Heart className="size-5 fill-berry text-berry" />} ids={favorites} more="/favorites" />
        )}
        {recent.length > 0 && <MiniRow title="সম্প্রতি শিখেছি" icon={<span className="emoji">🕒</span>} ids={recent.map((r) => r.itemId)} />}

        {/* Categories */}
        {groups.map((g) => {
          const list = cats.filter((c) => c.group === g.id);
          if (!list.length) return null;
          return (
            <section key={g.id} className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-2xl font-bold">
                <span className="emoji">{g.emoji}</span> {g.bn}
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                {list.map((c, i) => (
                  <CategoryCard key={c.id} cat={c} progress={catProgress(c.id)} index={i} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}

function MiniRow({ title, icon, ids, more }: { title: string; icon: ReactNode; ids: string[]; more?: string }) {
  const list = ids.map((id) => itemById.get(id)).filter(Boolean) as LearningItem[];
  if (!list.length) return null;
  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          {icon} {title}
        </h2>
        {more && (
          <Link to={more} className="text-sm font-semibold text-grape">
            সব দেখো
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
        {list.map((it) => {
          const cat = categoryById.get(it.categoryId)!;
          return (
            <motion.div key={it.id} whileTap={{ scale: 0.95 }}>
              <Link
                to={`/c/${it.categoryId}/${it.localId}`}
                className="flex w-24 shrink-0 flex-col items-center gap-1 rounded-3xl bg-white p-2 text-center shadow-pop"
              >
                <span className="grid h-14 place-items-center">
                  <ItemVisual item={it} size="sm" color={cat.color} />
                </span>
                <span className="w-full truncate text-sm font-bold">{it.symbol && it.bengaliName === it.symbol ? it.symbol : it.bengaliName}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
