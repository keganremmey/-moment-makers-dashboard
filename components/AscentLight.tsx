"use client";

import { useEffect, useState } from "react";

type Bolt = { id: number; x: number; y: number; dx: number; dy: number };

let seq = 0;

/**
 * The light a completed task throws toward the identity placard.
 *
 * Lives at the layout level rather than inside the checkbox on purpose: the
 * task row unmounts the moment the server revalidation lands and moves the row
 * into "Done", so anything animating inside that row gets torn out mid-flight.
 * An event-driven layer outlives its trigger.
 *
 * Rendered inline in the layout tree rather than portaled to document.body,
 * because this app's own `body > * { position: relative }` grain-stacking rule
 * beats a utility class on any node portaled directly to body and would
 * silently demote position:fixed.
 */
export function AscentLight() {
  const [bolts, setBolts] = useState<Bolt[]>([]);

  useEffect(() => {
    function onComplete(e: Event) {
      const detail = (e as CustomEvent<{ x: number; y: number; checkpointDay?: number | null }>).detail;
      const target = window.__ffPlacard?.();
      if (!detail || !target) return;
      const { x: fx, y: fy, checkpointDay } = detail;

      const id = ++seq;
      setBolts((b) => [
        ...b,
        { id, x: fx, y: fy, dx: target.x - fx, dy: target.y - fy },
      ]);

      // Strike the placard as the light lands, not when it launches. A
      // pending real mission-timeline checkpoint (set by layout.tsx, read by
      // TaskCheckbox at click time) escalates this landing to the big
      // celebration instead of the everyday plus-one, never both, so which
      // reward fires is grounded in genuine calendar progress rather than a
      // random roll.
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent("ff:placard-strike"));
        if (checkpointDay != null) {
          window.dispatchEvent(new CustomEvent("ff:placard-checkpoint", { detail: { day: checkpointDay } }));
        } else {
          window.dispatchEvent(new CustomEvent("ff:placard-plusone"));
        }
      }, 620);
    }

    window.addEventListener("ff:task-complete", onComplete);
    return () => window.removeEventListener("ff:task-complete", onComplete);
  }, []);

  if (bolts.length === 0) return null;

  return (
    <div className="ascent-light-layer" aria-hidden="true">
      {bolts.map((b) => (
        <span
          key={b.id}
          className="ascent-bolt"
          style={
            {
              left: `${b.x}px`,
              top: `${b.y}px`,
              "--bolt-dx": `${b.dx}px`,
              "--bolt-dy": `${b.dy}px`,
            } as React.CSSProperties
          }
          onAnimationEnd={() =>
            setBolts((cur) => cur.filter((x) => x.id !== b.id))
          }
        />
      ))}
    </div>
  );
}
