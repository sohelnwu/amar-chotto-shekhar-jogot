import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows when a new app version is ready (service worker waiting) or offline caching completes. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // check for updates every hour while the app is open
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh && !offlineReady) return null;
  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-3xl bg-ink p-4 text-white shadow-soft" role="status">
      <span className="flex-1 text-sm">
        {needRefresh ? 'অ্যাপের নতুন সংস্করণ এসেছে।' : 'অ্যাপটি এখন অফলাইনেও চলবে।'}
      </span>
      {needRefresh && (
        <button type="button" onClick={() => void updateServiceWorker(true)} className="inline-flex items-center gap-1 rounded-full bg-sun px-4 py-2 font-semibold text-ink">
          <RefreshCw className="size-4" /> আপডেট
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
        className="rounded-full px-3 py-2 text-sm text-white/80"
      >
        ঠিক আছে
      </button>
    </div>
  );
}
