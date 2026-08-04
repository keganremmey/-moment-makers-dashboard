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
        setError("Couldn't save — try again.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={done}
        disabled={isPending}
        onChange={toggle}
        className="h-4 w-4 accent-[var(--brass)]"
        aria-label={done ? "Mark task open" : "Mark task done"}
      />
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
