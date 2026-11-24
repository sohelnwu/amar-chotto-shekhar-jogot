import { lazy, Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { audio } from './audio';
import { BreakOverlay } from './components/BreakOverlay';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdatePrompt } from './components/UpdatePrompt';
import { CategoryPage } from './pages/CategoryPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { HomePage } from './pages/HomePage';
import { NotFound } from './pages/NotFound';
import { ScreenTimeProvider } from './state/screenTime';
import { SettingsProvider, useSettings } from './state/settings';

// Games and the parent area load on demand to keep the first load small.
const GamesPage = lazy(() => import('./pages/GamesPage').then((m) => ({ default: m.GamesPage })));
const GamePlayPage = lazy(() => import('./pages/GamesPage').then((m) => ({ default: m.GamePlayPage })));
const ParentPage = lazy(() => import('./pages/ParentPage').then((m) => ({ default: m.ParentPage })));

function ScrollAndAudioReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && audio.stop();
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);
  return null;
}

function Routed() {
  const { ready } = useSettings();
  if (!ready) return <div className="bg-playful min-h-dvh" aria-busy />;
  return (
    <>
      <ScrollAndAudioReset />
      <Suspense fallback={<div className="bg-playful min-h-dvh" aria-busy />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/c/:catId" element={<CategoryPage />} />
        <Route path="/c/:catId/:itemId" element={<FlashcardPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GamePlayPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/parent" element={<ParentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      <BreakOverlay />
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ScreenTimeProvider>
          <HashRouter>
            <Routed />
          </HashRouter>
          <UpdatePrompt />
        </ScreenTimeProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
