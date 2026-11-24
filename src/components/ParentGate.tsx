import { Delete, Lock } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toBn } from '../services/packs';

function newQuestion() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  return { a, b, answer: a * b };
}

/**
 * Parental verification: a multiplication question answered on a keypad.
 * Too hard for a 3–6 year-old, quick for an adult. Not a security boundary.
 */
export function ParentGate({ onPass, onCancel, title = 'অভিভাবকদের জন্য' }: { onPass: () => void; onCancel?: () => void; title?: string }) {
  const [q, setQ] = useState(newQuestion);
  const [value, setValue] = useState('');
  const [wrong, setWrong] = useState(false);
  const keys = useMemo(() => ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'], []);

  // ref mirrors the typed value so fast taps never read a stale render
  const typed = useRef('');
  const setTyped = (v: string) => {
    typed.current = v;
    setValue(v);
  };

  const press = (k: string) => {
    setWrong(false);
    if (k === 'del') return setTyped(typed.current.slice(0, -1));
    if (k === 'ok') {
      if (typed.current && Number(typed.current) === q.answer) return onPass();
      setWrong(true);
      setTyped('');
      setQ(newQuestion());
      return;
    }
    if (typed.current.length < 3) setTyped(typed.current + k);
  };

  return (
    <div className="mx-auto w-full max-w-sm rounded-4xl bg-white p-6 text-center shadow-soft" data-testid="parent-gate">
      <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-grape/10 text-grape">
        <Lock className="size-7" />
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-ink-soft">চালিয়ে যেতে উত্তর দিন</p>
      <p className="mt-4 text-4xl font-bold" data-testid="gate-question" data-a={q.a} data-b={q.b}>
        {toBn(q.a)} × {toBn(q.b)} = ?
      </p>
      <div
        className={`mx-auto mt-4 grid h-16 w-40 place-items-center rounded-2xl border-2 text-3xl font-bold ${
          wrong ? 'animate-wobble border-coral text-coral' : 'border-ink/10'
        }`}
        aria-live="polite"
      >
        {value ? toBn(value) : wrong ? 'আবার' : '…'}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            data-key={k}
            onClick={() => press(k)}
            aria-label={k === 'del' ? 'মুছুন' : k === 'ok' ? 'ঠিক আছে' : k}
            className={`pressable h-14 rounded-2xl text-2xl font-bold ${
              k === 'ok' ? 'bg-grape text-white' : k === 'del' ? 'bg-ink/5' : 'bg-cream-2'
            }`}
          >
            {k === 'del' ? <Delete className="mx-auto" /> : k === 'ok' ? 'ঠিক' : toBn(k)}
          </button>
        ))}
      </div>
      {onCancel && (
        <button type="button" onClick={onCancel} className="mt-4 text-ink-soft underline">
          ফিরে যান
        </button>
      )}
    </div>
  );
}
