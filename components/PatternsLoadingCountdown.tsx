"use client";

import { useEffect, useState } from "react";

const ESTIMATE_SECONDS = 18;

export function PatternsLoadingCountdown() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(ESTIMATE_SECONDS - elapsed, 0);
  const label =
    remaining > 0
      ? `About ${remaining}s left`
      : "Almost there, wrapping up the analysis";

  return (
    <p className="mt-1 flex items-center gap-2 text-sm text-ink-dim">
      <span
        className="h-1.5 w-1.5 rounded-full bg-gold motion-safe:animate-pulse"
        aria-hidden="true"
      />
      {label}
    </p>
  );
}
