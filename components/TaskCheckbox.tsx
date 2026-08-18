"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function TaskCheckbox({
  taskId,
  token,
  done,
}: {
  taskId: string;
  token: string;
  done: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${taskId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        setError("Couldn't save, try again.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {/* A custom-drawn box instead of the bare native checkbox, same
          lacquer-panel material language as .card/.btn (a small raised
          shadow at rest, a real pressed state on :active), not a naked
          form control sitting alone on rice paper. `appearance-none` drops
          only the browser's own paint; the input stays a real checkbox for
          keyboard, screen-reader, and label semantics. */}
      <input
        type="checkbox"
        checked={done}
        disabled={isPending}
        onChange={toggle}
        className="task-checkbox"
        aria-label={done ? "Mark task open" : "Mark task done"}
      />
      {error && <span className="text-sm text-lacquer">{error}</span>}
    </div>
  );
}
