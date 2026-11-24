import { ItemTile } from '../components/Cards';
import { Mascot } from '../components/Mascot';
import { TopBar } from '../components/TopBar';
import { categoryById, itemById } from '../content';
import type { LearningItem } from '../content/types';
import { useFavoriteList } from '../hooks/useLearning';
import { useSettings } from '../state/settings';

export function FavoritesPage() {
  const ids = useFavoriteList();
  const { settings } = useSettings();
  const list = ids.map((id) => itemById.get(id)).filter(Boolean) as LearningItem[];
  return (
    <div className="bg-playful child-area min-h-dvh pb-16">
      <TopBar title="আমার প্রিয়" color="#E84A8A" back="/" />
      <main className="mx-auto max-w-5xl px-3 sm:px-6">
        {list.length === 0 ? (
          <div className="mt-10 text-center">
            <Mascot className="mx-auto size-32" />
            <p className="mt-4 text-xl text-ink-soft">যেকোনো ছবিতে ❤️ চাপ দিলে এখানে জমা হবে।</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {list.map((it, i) => (
              <ItemTile key={it.id} item={it} color={categoryById.get(it.categoryId)!.color} to={`/c/${it.categoryId}/${it.localId}`} favorite showEnglish={settings.showEnglish} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
