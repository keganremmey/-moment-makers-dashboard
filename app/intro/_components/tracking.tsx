"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { UTM_KEYS, type Utm } from "@/lib/intro";

// Visit state for one browser tab: a random visit id plus the flyer's UTM
// values. Held in sessionStorage so the UTMs survive a trip to the privacy
// page and back. No cookies, nothing that outlives the tab.
type VisitState = { visitId: string; utm: Utm };
const KEY = "intro_visit";

function readVisit(): VisitState {
  let stored: VisitState | null = null;
  try {
    stored = JSON.parse(window.sessionStorage.getItem(KEY) ?? "null");
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key)?.trim().slice(0, 120);
    if (value) fromUrl[key] = value;
  }

  const state: VisitState = {
    visitId: stored?.visitId ?? crypto.randomUUID(),
    utm: Object.keys(fromUrl).length ? fromUrl : (stored?.utm ?? {}),
  };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  return state;
}

function beacon(body: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    if (!navigator.sendBeacon("/api/intro/track", blob)) throw new Error();
  } catch {
    fetch("/api/intro/track", { method: "POST", body: JSON.stringify(body), keepalive: true }).catch(() => {});
  }
}

function bookHref(cta: string, state?: VisitState): string {
  const params = new URLSearchParams({ cta });
  if (state) {
    params.set("vid", state.visitId);
    for (const [key, value] of Object.entries(state.utm)) params.set(key, value);
  }
  return `/intro/book?${params.toString()}`;
}

// Logs one "visit" per page load.
export function VisitBeacon() {
  useEffect(() => {
    const state = readVisit();
    beacon({ event: "visit", visitId: state.visitId, utm: state.utm, referrer: document.referrer });
  }, []);
  return null;
}

// Every booking button on the page. Works without JavaScript (plain link to
// /intro/book); with it, the flyer's UTMs and the visit id ride along.
export function BookLink({
  cta,
  className,
  children,
  id,
}: {
  cta: string;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.href = bookHref(cta, readVisit());
  }, [cta]);

  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const state = readVisit();
    event.currentTarget.href = bookHref(cta, state);
    beacon({ event: "cta_click", visitId: state.visitId, cta, utm: state.utm });
  }

  return (
    <a ref={ref} id={id} href={bookHref(cta)} onClick={onClick} className={className}>
      {children}
    </a>
  );
}

// Bottom booking bar on phones. Shows once the hero button has scrolled
// away and hides again when the final booking section is on screen, so it
// never sits on top of another booking button. The page reserves bottom
// padding for it so it never covers the footer.
export function StickyBook({ heroId, finalId }: { heroId: string; finalId: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const final = document.getElementById(finalId);
    if (!hero || !final) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setHeroVisible(entry.isIntersecting);
        if (entry.target === final) setFinalVisible(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    observer.observe(final);
    return () => observer.disconnect();
  }, [heroId, finalId]);

  const show = !heroVisible && !finalVisible;

  return (
    <div
      inert={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ttw-line bg-ttw-cream/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm transition-transform duration-200 motion-reduce:transition-none md:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <BookLink
        cta="sticky"
        className="flex min-h-12 w-full items-center justify-center rounded-md bg-ttw-copper px-4 text-center font-semibold text-ttw-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ttw-charcoal"
      >
        <span>Book your free 20 minutes</span>
      </BookLink>
    </div>
  );
}
