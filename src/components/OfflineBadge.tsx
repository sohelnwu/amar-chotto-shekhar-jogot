import { Wifi, WifiOff } from 'lucide-react';
import { useOnline } from '../hooks/useOnline';

export function OfflineBadge({ compact }: { compact?: boolean }) {
  const online = useOnline();
  if (compact && online) return null;
  return (
    <span
      role="status"
      data-testid="net-status"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
        online ? 'bg-leaf/15 text-leaf' : 'bg-ink/10 text-ink'
      }`}
    >
      {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
      {online ? 'অনলাইন' : 'অফলাইন'}
    </span>
  );
}
