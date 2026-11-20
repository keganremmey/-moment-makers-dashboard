// Client helper: fire-and-forget metric beacons to /api/body/metrics.
export function sendMetric(
  event: string,
  sessionId: string,
  resultId: string | null,
  props: Record<string, unknown> = {},
) {
  const body = JSON.stringify({ event, sessionId, resultId, props });
  try {
    if (navigator.sendBeacon?.("/api/body/metrics", new Blob([body], { type: "application/json" }))) return;
  } catch {}
  fetch("/api/body/metrics", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

export function readSessionId(): string {
  try {
    return window.localStorage.getItem("bup_session_id") ?? "";
  } catch {
    return "";
  }
}

// Wrapped so components can read a clock inside event handlers.
export function nowMs(): number {
  return performance.now();
}
