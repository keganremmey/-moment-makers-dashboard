"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { playLevelUpSweep, playBellCascadeEcho } from "@/lib/chime";

/**
 * The client's identity word as a struck placard: black field, white
 * letterforms, gold rule. It is the one element that appears on every page,
 * because it is who they are becoming rather than one page's content.
 *
 * It is also the destination for the task-completion light. Completing a task
 * dispatches a window event; the light is drawn from wherever the checkbox
 * sits to this placard's measured centre, so the motion always terminates on
 * the identity rather than dissipating into empty page.
 */
let plusOneSeq = 0;

export function IdentityPlacard({
  word,
  accent,
  token,
  pendingCheckpointDay,
}: {
  word: string;
  accent?: string | null;
  token: string;
  pendingCheckpointDay: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [struck, setStruck] = useState(false);
  const [hit, setHit] = useState(false);
  const [checkpoint, setCheckpoint] = useState(false);
  const [plusOnes, setPlusOnes] = useState<number[]>([]);
  const [bigOnes, setBigOnes] = useState<number[]>([]);
  const pathname = usePathname();
  // The overview route is the stats page: the KPI row, growth mountain and
  // belt ladder all live there. Landing on it announces the identity.
  const isStatsPage = pathname === `/d/${token}`;

  // Expose the placard's position as an on-demand getter rather than a
  // value kept fresh by scroll/resize listeners: the light only ever needs
  // this once, at the moment a task completes, so measuring live at read
  // time is both simpler and cheaper than reflowing on every scroll tick.
  useEffect(() => {
    const getPos = () => {
      const el = ref.current;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    window.__ffPlacard = getPos;
    return () => {
      if (window.__ffPlacard === getPos) window.__ffPlacard = undefined;
    };
  }, []);

  // A plain value, not a getter: TaskCheckbox only needs to know whether a
  // real mission-timeline checkpoint is waiting to be celebrated, read at
  // the moment someone completes a task, never kept fresh on a timer.
  useEffect(() => {
    window.__ffPendingCheckpointDay = pendingCheckpointDay;
    return () => {
      if (window.__ffPendingCheckpointDay === pendingCheckpointDay) {
        window.__ffPendingCheckpointDay = undefined;
      }
    };
  }, [pendingCheckpointDay]);

  // Struck by an arriving light, or by landing on a page that announces itself.
  useEffect(() => {
    const onArrive = () => {
      setStruck(false);
      requestAnimationFrame(() => setStruck(true));
    };
    window.addEventListener("ff:placard-strike", onArrive);
    if (isStatsPage) onArrive();
    return () => window.removeEventListener("ff:placard-strike", onArrive);
  }, [isStatsPage, pathname]);

  // The gold "+1", the shake, and the chime all ride the same event, and
  // only this event: the glow above also plays on stats-page arrival, but
  // a page landing shaking the placard and playing a sound every time
  // would train the ear to ignore it. This one fires on a real completion
  // only, so every shake and every chime means something actually happened.
  useEffect(() => {
    const onPlusOne = () => {
      const id = ++plusOneSeq;
      setPlusOnes((cur) => [...cur, id]);
      setHit(false);
      requestAnimationFrame(() => setHit(true));
      playLevelUpSweep();
    };
    window.addEventListener("ff:placard-plusone", onPlusOne);
    return () => window.removeEventListener("ff:placard-plusone", onPlusOne);
  }, []);

  // The escalated celebration for a real mission-timeline checkpoint: a
  // "+1,000" instead of "+1", the whole placard bursting rather than just
  // shaking, and the bell-cascade-with-echo instead of the everyday sweep.
  // Also tells the server this checkpoint has been shown, so it never
  // replays on a later, ordinary task completion.
  useEffect(() => {
    const onCheckpoint = (e: Event) => {
      const day = (e as CustomEvent<{ day: number }>).detail?.day;
      const id = ++plusOneSeq;
      setBigOnes((cur) => [...cur, id]);
      setCheckpoint(false);
      requestAnimationFrame(() => setCheckpoint(true));
      playBellCascadeEcho();

      if (typeof day === "number") {
        fetch("/api/checkpoints/acknowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, day }),
        }).catch(() => {});
      }
    };
    window.addEventListener("ff:placard-checkpoint", onCheckpoint);
    return () => window.removeEventListener("ff:placard-checkpoint", onCheckpoint);
  }, [token]);

  return (
    <div
      ref={ref}
      className={`identity-placard${struck ? " is-struck" : ""}${hit ? " is-hit" : ""}${checkpoint ? " is-checkpoint" : ""}`}
      style={accent ? ({ "--client-accent": accent } as React.CSSProperties) : undefined}
      onAnimationEnd={() => {
        setStruck(false);
        setHit(false);
        setCheckpoint(false);
      }}
    >
      <span className="identity-placard-rule" aria-hidden="true" />
      <span className="identity-placard-word font-display">{word}</span>
      <span className="identity-placard-rule" aria-hidden="true" />
      {plusOnes.map((id) => (
        <span
          key={id}
          className="identity-placard-plusone font-display"
          aria-hidden="true"
          onAnimationEnd={() => setPlusOnes((cur) => cur.filter((x) => x !== id))}
        >
          +1
        </span>
      ))}
      {bigOnes.map((id) => (
        <span
          key={id}
          className="identity-placard-plusone is-big font-display"
          aria-hidden="true"
          onAnimationEnd={() => setBigOnes((cur) => cur.filter((x) => x !== id))}
        >
          +1,000
        </span>
      ))}
    </div>
  );
}

declare global {
  interface Window {
    __ffPlacard?: () => { x: number; y: number } | null;
    __ffPendingCheckpointDay?: number | null;
  }
}
