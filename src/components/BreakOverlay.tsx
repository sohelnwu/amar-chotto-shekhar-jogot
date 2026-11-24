import { useEffect, useState } from 'react';
import { audio, phraseClip } from '../audio';
import { useScreenTime } from '../state/screenTime';
import { useSettings } from '../state/settings';
import { Mascot } from './Mascot';
import { ParentGate } from './ParentGate';

/** Gentle screen-time break; only a parent can continue. */
export function BreakOverlay() {
  const { onBreak, endBreak } = useScreenTime();
  const { settings } = useSettings();
  const [gate, setGate] = useState(false);

  useEffect(() => {
    if (onBreak) void audio.play('phrase:break', [phraseClip('break-time', settings.voice)]);
    else setGate(false);
  }, [onBreak, settings.voice]);

  if (!onBreak) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-gradient-to-b from-sky/90 to-grape/90 p-4" role="dialog" aria-modal>
      {gate ? (
        <ParentGate title="আরও কিছুক্ষণ?" onPass={endBreak} onCancel={() => setGate(false)} />
      ) : (
        <div className="text-center text-white">
          <Mascot className="mx-auto size-40" />
          <h2 className="mt-4 text-4xl font-bold">বিশ্রামের সময়! 🌙</h2>
          <p className="mx-auto mt-3 max-w-sm text-xl">অনেকক্ষণ শিখেছ! এখন একটু চোখ বন্ধ করো, পানি খাও আর খেলতে যাও।</p>
          <button type="button" onClick={() => setGate(true)} className="mt-10 rounded-full bg-white/20 px-5 py-2 text-sm">
            অভিভাবক
          </button>
        </div>
      )}
    </div>
  );
}
