"use client";

import { useEffect } from "react";
import { readSessionId, sendMetric } from "@/lib/body-metrics";

// Invisible. Reports to bup_events: page view, scroll depth (25/50/75/100),
// which numbered sections were seen, and active time on the page (time with
// the tab visible). Time is sent each time the tab is hidden or closed; the
// stats view keeps the largest value.
export default function ResultsTracker({ resultId }: { resultId: string }) {
  useEffect(() => {
    const sid = readSessionId();
    const start = performance.now();
    let activeMs = 0;
    let visibleSince: number | null = document.visibilityState === "visible" ? start : null;
    let maxPct = 0;
    const sent = new Set<number>();
    const seen = new Set<string>();

    sendMetric("results_page_view", sid, resultId, {});

    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const pct = Math.min(100, Math.round(((window.scrollY + 1) / max) * 100));
      if (pct > maxPct) maxPct = pct;
      for (const m of [25, 50, 75, 100]) {
        if (maxPct >= m && !sent.has(m)) {
          sent.add(m);
          sendMetric("results_scroll_milestone", sid, resultId, { pct: m, ms_since_load: performance.now() - start });
        }
      }
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = (e.target as HTMLElement).dataset.trackSection;
          if (e.isIntersecting && n && !seen.has(n)) {
            seen.add(n);
            sendMetric("results_section_reached", sid, resultId, { section: n, ms_since_load: performance.now() - start });
          }
        }
      },
      { threshold: 0.4 },
    );
    document.querySelectorAll("[data-track-section]").forEach((el) => io.observe(el));

    function flush() {
      const now = performance.now();
      if (visibleSince !== null) {
        activeMs += now - visibleSince;
        visibleSince = null;
      }
      sendMetric("results_time_on_page", sid, resultId, { active_ms: activeMs, total_ms: now - start, max_scroll: maxPct });
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
      else visibleSince = performance.now();
    }

    // Count taps on the PDF link.
    function onClick(ev: MouseEvent) {
      const a = (ev.target as HTMLElement | null)?.closest?.("a[data-track-pdf]");
      if (a) sendMetric("results_pdf_click", sid, resultId, { ms_since_load: performance.now() - start });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    document.addEventListener("click", onClick);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("click", onClick);
      io.disconnect();
    };
  }, [resultId]);

  return null;
}
