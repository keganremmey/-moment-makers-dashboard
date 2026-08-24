"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AddTaskInput({ token }: { token: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const title = value.trim();
    if (!title || isPending) return;
    setError(null);

    startTransition(async () => {
      const res = await fetch("/api/tasks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, title }),
      });

      if (!res.ok) {
        setError("Couldn't save, try again.");
        return;
      }

      setValue("");
      router.refresh();
    });
  }

  return (
    <section className="card p-5">
      <p className="label">Add a task</p>
      <input
        type="text"
        value={value}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="What needs doing?"
        className="mt-3 w-full rounded-lg border border-paper-line bg-paper-raised px-4 py-2.5 text-base text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-paper"
      />
      {error && <p className="mt-2 text-sm text-lacquer">{error}</p>}
    </section>
  );
}
