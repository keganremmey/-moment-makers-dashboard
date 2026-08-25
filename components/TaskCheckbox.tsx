"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { primeAudio } from "@/lib/chime";

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
  const boxRef = useRef<HTMLInputElement>(null);

  function toggle() {
    setError(null);

    // Unlock audio synchronously, inside this real user gesture. The chime
    // itself plays ~620ms later once the completion light lands, well
    // outside the gesture window mobile browsers require for starting
    // sound, so without this the light would land silently on a phone.
    if (!done) primeAudio();

    // Fire on the open -> done direction only, and fire at click time rather
    // than after the round trip: the row is unmounted by the revalidation that
    // follows, so a light launched afterward would launch from a dead node.
    if (!done && boxRef.current) {
      const r = boxRef.current.getBoundingClientRect();
      const checkpointDay = window.__ffPendingCheckpointDay ?? null;
      window.dispatchEvent(
        new CustomEvent("ff:task-complete", {
          detail: {
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            checkpointDay,
          },
        })
      );
    }

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
        ref={boxRef}
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
