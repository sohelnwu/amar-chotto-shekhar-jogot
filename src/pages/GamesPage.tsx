import { motion } from 'framer-motion';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { TopBar } from '../components/TopBar';
import { GAMES, gameById } from '../games/catalog';
import { AddGame, CountGame, ListenGame, MemoryGame, MissingGame, OddGame, QuizGame } from '../games/Games';
import { gameTopics } from '../games/logic';
import { useSettings } from '../state/settings';
import { NotFound } from './NotFound';

export function GamesPage() {
  const { settings } = useSettings();
  const list = GAMES.filter((g) => g.minLevel <= settings.level);
  return (
    <div className="bg-playful child-area min-h-dvh pb-16">
      <TopBar title="খেলি ও শিখি" subtitle="কোনো তাড়া নেই — মজা করে খেলো" color="#FF7A59" back="/" />
      <main className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-3 sm:grid-cols-3 sm:gap-4 sm:px-6">
        {list.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link
              to={`/games/${g.id}`}
              data-testid={`game-${g.id}`}
              className="pressable flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-4xl p-4 text-center text-white shadow-pop"
              style={{ background: `linear-gradient(145deg, ${g.color}, ${g.color}cc)` }}
            >
              <span className="emoji grid size-20 place-items-center rounded-3xl bg-white/90 text-5xl">{g.emoji}</span>
              <span className="text-xl font-bold leading-tight">{g.bn}</span>
              <span className="text-sm opacity-90">{g.desc}</span>
            </Link>
          </motion.div>
        ))}
      </main>
    </div>
  );
}

export function GamePlayPage() {
  const { gameId = '' } = useParams();
  const [params] = useSearchParams();
  const { settings } = useSettings();
  const game = gameById.get(gameId);
  if (!game) return <NotFound />;
  const kind = game.base ?? game.id;
  const topic = game.presetTopic ?? params.get('topic') ?? '';

  if (game.topic && !topic) return <TopicPicker gameId={game.id} title={game.bn} color={game.color} level={settings.level} />;

  const props = { game, topic };
  const key = `${game.id}:${topic}`;
  switch (kind) {
    case 'listen':
      return <ListenGame key={key} {...props} />;
    case 'quiz':
      return <QuizGame key={key} {...props} />;
    case 'memory':
      return <MemoryGame key={key} {...props} />;
    case 'count':
      return <CountGame key={key} {...props} />;
    case 'add':
      return <AddGame key={key} {...props} />;
    case 'odd':
      return <OddGame key={key} {...props} />;
    case 'missing':
      return <MissingGame key={key} {...props} />;
    default:
      return <NotFound />;
  }
}

function TopicPicker({ gameId, title, color, level }: { gameId: string; title: string; color: string; level: 1 | 2 | 3 }) {
  const topics = gameTopics(level).filter((c) => (gameId === 'quiz' || gameId === 'missing' ? c.kind === 'cards' || c.kind === 'colors' || c.kind === 'shapes' : true));
  return (
    <div className="bg-playful child-area min-h-dvh pb-16">
      <TopBar title={title} subtitle="একটা বিষয় বেছে নাও" color={color} back="/games" />
      <main className="mx-auto grid max-w-5xl grid-cols-2 gap-3 px-3 sm:grid-cols-4 sm:px-6">
        <Link to={`/games/${gameId}?topic=mix`} data-testid="topic-mix" className="pressable col-span-2 flex items-center justify-center gap-3 rounded-4xl bg-white p-5 text-2xl font-bold shadow-pop sm:col-span-4">
          <span className="emoji text-4xl">🎲</span> সব মিলিয়ে
        </Link>
        {topics.map((c) => (
          <Link
            key={c.id}
            to={`/games/${gameId}?topic=${c.id}`}
            data-testid={`topic-${c.id}`}
            className="pressable flex flex-col items-center gap-2 rounded-4xl p-4 text-center text-white shadow-pop"
            style={{ background: c.color }}
          >
            <span className={`grid size-16 place-items-center rounded-3xl bg-white/90 ${c.glyph ? 'text-3xl font-bold' : 'emoji text-4xl'}`} style={c.glyph ? { color: c.color } : undefined}>
              {c.emoji}
            </span>
            <span className="text-lg font-bold">{c.bengaliName}</span>
          </Link>
        ))}
      </main>
    </div>
  );
}
