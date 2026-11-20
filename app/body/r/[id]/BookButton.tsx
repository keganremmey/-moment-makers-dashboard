"use client";

import { sendMetric } from "@/lib/body-metrics";
import styles from "./report.module.css";

const LABEL = "Book My Fit Call →";

// Booking CTA. Logs booking_clicked to the body site's event table (same
// event the original report sends) before following the link.
export default function BookButton({ href, resultId }: { href: string; resultId: string }) {
  function onClick() {
    let sessionId = "";
    try {
      sessionId = window.localStorage.getItem("bup_session_id") ?? "";
    } catch {}
    const body = JSON.stringify({ event: "booking_clicked", sessionId, resultId, props: { label: LABEL, version: "event-v1" } });
    try {
      navigator.sendBeacon("/api/body/track", new Blob([body], { type: "application/json" }));
    } catch {}
    sendMetric("results_cta_click", sessionId, resultId, { ms_since_load: Math.round(performance.now()), label: LABEL });
  }

  return (
    <a href={href} className={styles.book} onClick={onClick}>
      {LABEL}
    </a>
  );
}
