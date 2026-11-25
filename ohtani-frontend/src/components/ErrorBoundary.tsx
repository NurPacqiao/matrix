import { Component, type ErrorInfo, type ReactNode } from "react";

// Without this, one rendering error leaves a blank screen (and an installed app has no reload button)
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Rendering failed", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-bone-muted">Something broke. Your saved data is safe.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2.5 rounded-lg bg-accent text-ink-950 text-sm font-semibold"
        >
          Reload
        </button>
      </div>
    );
  }
}
