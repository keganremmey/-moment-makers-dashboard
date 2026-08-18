"use client";

import { useState } from "react";

export function PatternDraftMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <textarea
        readOnly
        value={text}
        rows={4}
        className="w-full resize-none rounded-md border border-paper-line bg-paper-raised p-3 text-base leading-relaxed text-ink"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="btn btn-ghost self-start"
      >
        {copied ? "Copied" : "Copy message"}
      </button>
    </div>
  );
}
