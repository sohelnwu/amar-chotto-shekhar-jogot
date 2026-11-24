import { Loader2, Pause, Volume2, VolumeX } from 'lucide-react';
import type { ReactNode } from 'react';
import { audio, useAudioState } from '../audio';
import type { Clip } from '../audio/AudioEngine';

interface Props {
  playKey: string;
  clips: Clip[];
  label: string;
  color?: string;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  caption?: string;
  testId?: string;
}

/** Round play button that reflects the shared engine state for its key. */
export function AudioButton({ playKey, clips, label, color = '#7C5CFC', size = 'md', icon, caption, testId }: Props) {
  const st = useAudioState();
  const mine = st.key === playKey;
  const playable = clips.some((c) => audio.canPlay(c));
  const unavailable = !playable || (mine && st.status === 'unavailable');
  const dim = size === 'lg' ? 'size-20 sm:size-24' : 'size-16 sm:size-[4.5rem]';

  let body: ReactNode = icon ?? <Volume2 className="size-1/2" strokeWidth={2.5} />;
  if (unavailable) body = <VolumeX className="size-1/2" strokeWidth={2.5} />;
  else if (mine && st.status === 'loading') body = <Loader2 className="size-1/2 animate-spin" strokeWidth={2.5} />;
  else if (mine && st.status === 'playing' && st.source === 'file') body = <Pause className="size-1/2" strokeWidth={2.5} />;
  else if (mine && st.status === 'playing') body = <Equalizer />;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        data-testid={testId}
        data-state={unavailable ? 'unavailable' : mine ? st.status : 'idle'}
        aria-label={unavailable ? `${label} — অডিও নেই` : label}
        aria-disabled={unavailable}
        onClick={() => {
          if (unavailable && !playable) return;
          audio.toggle(playKey, clips);
        }}
        className={`pressable ${dim} grid place-items-center rounded-full text-white shadow-pop ${
          unavailable ? 'opacity-45 grayscale' : ''
        } ${mine && st.status === 'playing' ? 'ring-4 ring-white/80' : ''}`}
        style={{ background: color }}
      >
        {body}
      </button>
      {caption && <span className="text-sm font-semibold text-ink-soft">{caption}</span>}
    </div>
  );
}

export function Equalizer() {
  return (
    <span className="flex h-1/2 items-end gap-1" aria-hidden>
      {[0, 0.15, 0.3, 0.1].map((d, i) => (
        <span key={i} className="eq-bar block h-full w-1.5 rounded-full bg-white" style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

/** Small notice shown when the last attempted clip is not available. */
export function AudioUnavailableNotice() {
  const st = useAudioState();
  if (st.status !== 'unavailable') return null;
  return (
    <p role="status" className="mx-auto mt-3 max-w-md rounded-2xl bg-white/90 px-4 py-2 text-center text-sm text-ink-soft shadow-soft">
      🔇 {st.message}
    </p>
  );
}
