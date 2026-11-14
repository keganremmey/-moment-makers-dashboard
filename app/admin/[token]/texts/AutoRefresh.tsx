"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-fetches the page on a timer while the tab is visible, so new drafts
// and send results show up without a manual reload. Skips a tick while the
// person is typing in a draft so their edit isn't interrupted.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const active = document.activeElement;
      if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) return;
      router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
