import { Component, type ReactNode } from 'react';

/** Child-friendly fallback so a bug never leaves a blank screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('App error:', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="bg-playful grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="emoji text-7xl">🦉</p>
          <h1 className="mt-4 text-3xl font-bold">ওহ! কিছু একটা গোলমাল হয়েছে</h1>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
            className="pressable mt-6 rounded-full bg-grape px-6 py-3 text-xl font-bold text-white shadow-pop"
          >
            আবার শুরু করো
          </button>
        </div>
      </div>
    );
  }
}
