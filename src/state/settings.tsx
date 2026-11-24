import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { audio } from '../audio';
import { DEFAULT_SETTINGS, type Settings } from '../database/db';
import { loadSettings, saveSettings } from '../database/repo';

interface Ctx {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, ready: false, update: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadSettings()
      .then(setSettings)
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    audio.setVolume(settings.volume);
    audio.ttsFallback = settings.ttsFallback;
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void saveSettings(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, ready, update }), [settings, ready, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
