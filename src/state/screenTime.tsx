import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSettings } from './settings';

const SESSION_KEY = 'acsj-session-seconds';
const dayKey = () => `acsj-day-${new Date().toISOString().slice(0, 10)}`;

interface Ctx {
  sessionSeconds: number;
  todaySeconds: number;
  onBreak: boolean;
  endBreak: () => void;
}

const ScreenTimeContext = createContext<Ctx>({ sessionSeconds: 0, todaySeconds: 0, onBreak: false, endBreak: () => {} });

function readNum(storage: Storage, key: string) {
  return Number(storage.getItem(key) ?? 0) || 0;
}

/** Counts visible-app time; shows a gentle break screen when the parent's limit is reached. */
export function ScreenTimeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [sessionSeconds, setSession] = useState(() => readNum(sessionStorage, SESSION_KEY));
  const [todaySeconds, setToday] = useState(() => readNum(localStorage, dayKey()));
  const [onBreak, setOnBreak] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSession((s) => {
        const n = s + 5;
        sessionStorage.setItem(SESSION_KEY, String(n));
        return n;
      });
      setToday(() => {
        const n = readNum(localStorage, dayKey()) + 5;
        localStorage.setItem(dayKey(), String(n));
        return n;
      });
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const limit = settings.screenTimeMinutes * 60;
    if (limit > 0 && sessionSeconds >= limit && !onBreak) setOnBreak(true);
  }, [sessionSeconds, settings.screenTimeMinutes, onBreak]);

  const endBreak = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '0');
    setSession(0);
    setOnBreak(false);
  }, []);

  return (
    <ScreenTimeContext.Provider value={{ sessionSeconds, todaySeconds, onBreak, endBreak }}>
      {children}
    </ScreenTimeContext.Provider>
  );
}

export const useScreenTime = () => useContext(ScreenTimeContext);
