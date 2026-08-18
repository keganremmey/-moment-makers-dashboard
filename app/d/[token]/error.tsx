"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="forte-mark text-2xl">𝑓𝑓</p>
      <h1 className="mt-4 font-display text-xl text-ink">
        Couldn&apos;t load this dashboard.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ink-dim">
        Try refreshing.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn btn-outline mt-6"
      >
        Try again
      </button>
    </main>
  );
}
