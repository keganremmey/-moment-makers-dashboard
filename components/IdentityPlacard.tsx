"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
export function IdentityPlacard({
  word,
  accent,
  token,
}: {
  word: string;
  accent?: string | null;
  token: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [struck, setStruck] = useState(false);
  const pathname = usePathname();
  // The overview route is the stats page: the KPI row, growth mountain and
  // belt ladder all live there. Landing on it announces the identity.
  const isStatsPage = pathname === `/d/${token}`;

  // Publish the placard's live position so the traveling light has a real
  // target. Recomputed on resize and scroll rather than cached at mount,
  // since the header is sticky and the page below it scrolls independently.
  useEffect(() => {
    const publish = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      window.__ffPlacard = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    publish();
    window.addEventListener("resize", publish);
    window.addEventListener("scroll", publish, { passive: true });
    return () => {
      window.removeEventListener("resize", publish);
      window.removeEventListener("scroll", publish);
    };
  }, []);

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

  return (
    <div
      ref={ref}
      className={`identity-placard${struck ? " is-struck" : ""}`}
      style={accent ? ({ "--client-accent": accent } as React.CSSProperties) : undefined}
      onAnimationEnd={() => setStruck(false)}
    >
      <span className="identity-placard-rule" aria-hidden="true" />
      <span className="identity-placard-word font-display">{word}</span>
      <span className="identity-placard-rule" aria-hidden="true" />
    </div>
  );
}

declare global {
  interface Window {
    __ffPlacard?: { x: number; y: number };
  }
}
