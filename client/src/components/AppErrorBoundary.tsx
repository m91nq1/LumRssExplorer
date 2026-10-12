import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    // Do not log application data, session details or provider responses.
    console.error("LUM News could not render the page.", error instanceof TypeError ? "TypeError" : error instanceof RangeError ? "RangeError" : "RenderError");
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-6 text-foreground">
        <section className="max-w-md space-y-4 rounded-lg border bg-card p-6" role="alert">
          <h1 className="text-xl font-semibold">This page couldn’t load</h1>
          <p className="text-sm text-muted-foreground">
            LUM News encountered a display error. Try reloading the page. Your saved articles and settings have not been changed.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
            <a className="self-center text-sm underline" href="/landing">Go to landing page</a>
          </div>
        </section>
      </main>
    );
  }
}
