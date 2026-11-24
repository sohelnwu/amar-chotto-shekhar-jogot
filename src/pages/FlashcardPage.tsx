import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { BookOpen, ChevronLeft, ChevronRight, Heart, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { audio, descBnClip, descEnClip, nameBnClip, nameEnClip, primaryClip, useAudioState } from '../audio';
import { AudioButton, AudioUnavailableNotice } from '../components/AudioButton';
import { CountRow, ItemVisual } from '../components/ItemVisual';
import { TopBar } from '../components/TopBar';
import { categoryById, getItems, itemById } from '../content';
import type { VoiceGender } from '../content/types';
import { recordView, toggleFavorite } from '../database/repo';
import { useFavorites } from '../hooks/useLearning';
import { toBn } from '../services/packs';
import { useSettings } from '../state/settings';
import { NotFound } from './NotFound';

export function FlashcardPage() {
  const { catId = '', itemId = '' } = useParams();
  const nav = useNavigate();
  const { settings, update } = useSettings();
  const favs = useFavorites();
  const st = useAudioState();
  const cat = categoryById.get(catId);
  const list = cat ? getItems(cat.id, settings.level) : [];
  const index = list.findIndex((i) => i.localId === itemId);
  const item = index >= 0 ? list[index] : cat ? itemById.get(`${cat.id}/${itemId}`) : undefined;
  const [dir, setDir] = useState(1);
  const tapCount = useRef(0);
  const v: VoiceGender = settings.voice;

  useEffect(() => {
    if (!item) return;
    tapCount.current = 0;
    void recordView(item.id, item.categoryId);
    if (settings.autoPlay && cat) void audio.play(`name:${item.id}`, [primaryClip(item, v, cat.primaryLang)]);
    return () => audio.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!cat || !item) return <NotFound />;

  const isStory = cat.kind === 'story';
  const go = (delta: number) => {
    if (!list.length) return;
    const next = list[(index + delta + list.length) % list.length];
    setDir(delta);
    nav(`/c/${cat.id}/${next.localId}`, { replace: true });
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -80) go(1);
    else if (info.offset.x > 80) go(-1);
  };
  const nameClips = [primaryClip(item, v, cat.primaryLang)];
  const descClips = cat.primaryLang === 'en' && item.descriptionEn ? [descEnClip(item, v), descBnClip(item, v)] : [descBnClip(item, v)];
  const tapPicture = () => {
    // 1st tap: name, 2nd tap: short description, then alternate
    const n = tapCount.current++;
    if (n % 2 === 0) void audio.play(`name:${item.id}`, nameClips);
    else void audio.play(`desc:${item.id}`, descClips);
  };
  const fav = favs.has(item.id);
  const speaking = st.status === 'playing' && (st.key === `name:${item.id}` || st.key === `desc:${item.id}`);
  const showEn = settings.showEnglish && cat.hasEnglishAudio && cat.primaryLang !== 'en';
  const related = item.relatedItems.map((r) => itemById.get(r)).filter((r) => r && r.ageLevel <= settings.level);

  return (
    <div className="bg-playful child-area flex min-h-dvh flex-col pb-6">
      <TopBar
        title={cat.bengaliName}
        subtitle={index >= 0 ? `${toBn(index + 1)} / ${toBn(list.length)}` : undefined}
        color={cat.color}
        back={`/c/${cat.id}`}
        right={
          <button
            type="button"
            data-testid="fav-toggle"
            aria-pressed={fav}
            aria-label={fav ? 'প্রিয় থেকে সরাও' : 'প্রিয়তে রাখো'}
            onClick={() => void toggleFavorite(item.id)}
            className="pressable grid size-14 shrink-0 place-items-center rounded-2xl bg-white shadow-pop"
          >
            <Heart className={`size-7 ${fav ? 'fill-berry text-berry' : 'text-ink-soft'}`} />
          </button>
        }
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 sm:px-6">
        <div className="relative flex flex-1 items-center gap-2">
          {!isStory && <NavArrow dir="prev" color={cat.color} onClick={() => go(-1)} />}
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.section
              key={item.id}
              custom={dir}
              initial={{ opacity: 0, x: dir * 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -80 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              drag={isStory ? false : 'x'}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.5}
              onDragEnd={onDragEnd}
              className="flex min-w-0 flex-1 flex-col items-center rounded-[2.5rem] bg-white p-5 text-center shadow-soft sm:p-8"
              style={{ boxShadow: `0 18px 40px -18px ${cat.color}88` }}
              data-testid="flashcard"
              data-item={item.id}
            >
              <motion.button
                type="button"
                aria-label={`${item.bengaliName} — শোনো`}
                onClick={tapPicture}
                animate={speaking ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={speaking ? { repeat: Infinity, duration: 1.2 } : {}}
                className="grid min-h-48 w-full place-items-center rounded-[2rem] py-4 sm:min-h-64"
                style={{ background: `radial-gradient(circle at 50% 40%, ${cat.color}1f, transparent 70%)` }}
                data-testid="picture"
              >
                <ItemVisual item={item} size={isStory ? 'lg' : 'xl'} color={cat.color} />
              </motion.button>

              {cat.kind === 'numbers' && item.count && item.emoji && (
                <div className="mt-2">
                  <CountRow emoji={item.emoji} count={item.count} big={item.count <= 10} />
                </div>
              )}

              <h2 className="mt-3 text-5xl font-bold leading-tight sm:text-6xl" style={{ color: cat.color }} data-testid="item-name">
                {cat.primaryLang === 'en' ? item.englishName : item.bengaliName}
              </h2>
              {(settings.showEnglish || cat.primaryLang === 'en') && (
                <p className="mt-1 text-2xl font-semibold text-ink-soft">{cat.primaryLang === 'en' ? item.bengaliName : item.englishName}</p>
              )}
              <p className={`mt-3 max-w-xl text-ink ${isStory ? 'text-left text-2xl leading-relaxed' : 'text-xl'}`}>{item.descriptionBn}</p>
              {item.credit && <p className="mt-2 text-sm text-ink-soft">— {item.credit}</p>}
            </motion.section>
          </AnimatePresence>
          {!isStory && <NavArrow dir="next" color={cat.color} onClick={() => go(1)} />}
        </div>

        <AudioUnavailableNotice />

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-start justify-center gap-4">
          {!isStory && (
            <AudioButton playKey={`name:${item.id}`} clips={nameClips} label="নাম শোনো" caption="নাম" color={cat.color} size="lg" testId="play-name" />
          )}
          <AudioButton
            playKey={`desc:${item.id}`}
            clips={descClips}
            label={isStory ? 'গল্প শোনো' : 'পরিচিতি শোনো'}
            caption={isStory ? 'শোনো' : 'পরিচিতি'}
            color={isStory ? cat.color : '#3FB47C'}
            size="lg"
            icon={<BookOpen className="size-1/2" strokeWidth={2.5} />}
            testId="play-desc"
          />
          {showEn && (
            <AudioButton
              playKey={`en:${item.id}`}
              clips={[nameEnClip(item, v)]}
              label="ইংরেজিতে শোনো"
              caption="English"
              color="#4C8BF5"
              icon={<span className="text-xl font-bold">EN</span>}
              testId="play-en"
            />
          )}
          {cat.primaryLang === 'en' && (
            <AudioButton
              playKey={`bn:${item.id}`}
              clips={[nameBnClip(item, v), descBnClip(item, v)]}
              label="বাংলায় শোনো"
              caption="বাংলায়"
              color="#FF7A59"
              icon={<span className="text-xl font-bold">বাং</span>}
            />
          )}
          {item.audio.natural && audio.has(item.audio.natural) && (
            <AudioButton playKey={`nat:${item.id}`} clips={[{ src: item.audio.natural, lang: 'bn' }]} label="আসল ডাক শোনো" caption="আসল ডাক" color="#E8A33D" icon={<span className="emoji text-2xl">🔊</span>} />
          )}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              aria-label="আবার শোনো"
              onClick={() => (st.key ? audio.replay() : tapPicture())}
              className="pressable grid size-16 place-items-center rounded-full bg-white text-ink shadow-pop sm:size-[4.5rem]"
            >
              <RotateCcw className="size-1/2" strokeWidth={2.5} />
            </button>
            <span className="text-sm font-semibold text-ink-soft">আবার</span>
          </div>
        </div>

        {/* Voice selection */}
        <div className="mt-5 flex justify-center">
          <div className="inline-flex rounded-full bg-white p-1 shadow-soft" role="radiogroup" aria-label="কণ্ঠ বেছে নাও">
            {(['female', 'male'] as const).map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={v === g}
                data-testid={`voice-${g}`}
                onClick={() => {
                  audio.stop(); // never let the old voice keep playing under the same key
                  update({ voice: g });
                }}
                className={`rounded-full px-5 py-2 text-lg font-semibold transition ${v === g ? 'bg-grape text-white' : 'text-ink-soft'}`}
              >
                <span className="emoji mr-1">{g === 'female' ? '👩' : '👨'}</span>
                {g === 'female' ? 'আপু' : 'ভাইয়া'}
              </button>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 text-lg font-bold text-ink-soft">আরও দেখো</h3>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
              {related.map((r) => (
                <Link key={r!.id} to={`/c/${r!.categoryId}/${r!.localId}`} className="pressable flex w-24 shrink-0 flex-col items-center rounded-3xl bg-white p-2 shadow-pop">
                  <ItemVisual item={r!} size="sm" color={categoryById.get(r!.categoryId)?.color} />
                  <span className="mt-1 w-full truncate text-center text-sm font-bold">{r!.bengaliName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function NavArrow({ dir, color, onClick }: { dir: 'prev' | 'next'; color: string; onClick: () => void }) {
  const Icon = dir === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      data-testid={dir}
      aria-label={dir === 'prev' ? 'আগেরটা' : 'পরেরটা'}
      onClick={onClick}
      className="pressable z-10 grid size-14 shrink-0 place-items-center rounded-full text-white shadow-pop sm:size-16"
      style={{ background: color }}
    >
      <Icon className="size-9" strokeWidth={3} />
    </button>
  );
}
