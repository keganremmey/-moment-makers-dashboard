import { PatternsLoadingCountdown } from "@/components/PatternsLoadingCountdown";

export default function PatternsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label">Cross-session patterns</p>
        <p className="mt-1 text-sm text-ink-dim">
          Reading through logged sessions and journal entries to surface real
          patterns.
        </p>
        <PatternsLoadingCountdown />
      </div>

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-5">
            <div className="motion-safe:animate-pulse h-4 w-40 rounded bg-paper-line" />
            <div className="motion-safe:animate-pulse mt-3 h-4 w-full rounded bg-paper-line" />
            <div className="motion-safe:animate-pulse mt-2 h-4 w-2/3 rounded bg-paper-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
