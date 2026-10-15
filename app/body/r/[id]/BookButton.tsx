"use client";

import styles from "./report.module.css";

const LABEL = "Schedule My Session →";

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
  }

  return (
    <a href={href} className={styles.book} onClick={onClick}>
      {LABEL}
    </a>
  );
}
