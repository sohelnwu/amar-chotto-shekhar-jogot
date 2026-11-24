import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ParentGate } from '../../src/components/ParentGate';

afterEach(cleanup);

function answer() {
  const q = screen.getByTestId('gate-question');
  return String(Number(q.dataset.a) * Number(q.dataset.b));
}
function type(text: string) {
  for (const d of text) fireEvent.click(document.querySelector(`[data-key="${d}"]`)!);
  fireEvent.click(document.querySelector('[data-key="ok"]')!);
}

describe('ParentGate', () => {
  it('opens only with the correct answer', () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} />);
    const right = answer();
    type(String(Number(right) + 1));
    expect(onPass).not.toHaveBeenCalled();
    type(answer()); // a new question is shown after a wrong answer
    expect(onPass).toHaveBeenCalledTimes(1);
  });

  it('does not pass on an empty answer', () => {
    const onPass = vi.fn();
    render(<ParentGate onPass={onPass} />);
    fireEvent.click(document.querySelector('[data-key="ok"]')!);
    expect(onPass).not.toHaveBeenCalled();
  });
});
