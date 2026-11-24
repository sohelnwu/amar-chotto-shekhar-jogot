import { Gamepad2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ItemTile } from '../components/Cards';
import { TopBar } from '../components/TopBar';
import { categoryById, getItems } from '../content';
import { useFavorites, useProgressMap } from '../hooks/useLearning';
import { toBn } from '../services/packs';
import { useSettings } from '../state/settings';
import { NotFound } from './NotFound';

export function CategoryPage() {
  const { catId = '' } = useParams();
  const cat = categoryById.get(catId);
  const { settings } = useSettings();
  const progress = useProgressMap();
  const favs = useFavorites();
  if (!cat) return <NotFound />;
  const list = getItems(cat.id, settings.level);
  const seen = list.filter((i) => (progress.get(i.id)?.views ?? 0) > 0).length;
  const gameable = cat.kind !== 'story' && list.length >= 4;

  return (
    <div className="bg-playful child-area min-h-dvh pb-16">
      <TopBar title={cat.bengaliName} subtitle={`${toBn(seen)} / ${toBn(list.length)} টি দেখা হয়েছে`} color={cat.color} back="/" />
      <main className="mx-auto max-w-5xl px-3 sm:px-6">
        {gameable && (
          <Link
            to={`/games/listen?topic=${cat.id}`}
            className="pressable mb-4 flex items-center gap-3 rounded-3xl p-4 text-white shadow-pop"
            style={{ background: cat.color }}
          >
            <Gamepad2 className="size-8" />
            <span className="text-xl font-bold">এই বিষয় দিয়ে খেলি</span>
          </Link>
        )}
        {cat.kind === 'story' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((it) => (
              <Link
                key={it.id}
                to={`/c/${cat.id}/${it.localId}`}
                data-testid={`item-${it.localId}`}
                className="pressable flex items-center gap-4 rounded-4xl bg-white p-4 shadow-pop"
              >
                <span className="emoji grid size-20 shrink-0 place-items-center rounded-3xl text-5xl" style={{ background: `${cat.color}18` }}>
                  {it.emoji}
                </span>
                <span>
                  <span className="block text-xl font-bold">{it.bengaliName}</span>
                  <span className="text-sm text-ink-soft">{it.tags.includes('rhyme') ? 'ছড়া' : 'গল্প'}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {list.map((it, i) => (
              <ItemTile
                key={it.id}
                item={it}
                color={cat.color}
                to={`/c/${cat.id}/${it.localId}`}
                seen={(progress.get(it.id)?.views ?? 0) > 0}
                favorite={favs.has(it.id)}
                showEnglish={settings.showEnglish}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
