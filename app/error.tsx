"use client";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="forte-mark text-2xl">𝑓𝑓</p>
      <h1 className="mt-4 font-display text-xl text-paper">
        Something went wrong.
      </h1>
      <p className="mt-3 max-w-sm text-sm text-paper-dim">
        Try refreshing.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md border border-brass px-4 py-2 text-sm font-medium text-brass transition-colors hover:bg-brass hover:text-ink focus-visible:outline-2 focus-visible:outline-brass focus-visible:outline-offset-[3px]"
      >
        Try again
      </button>
    </main>
  );
}
