"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Framework } from "@/lib/data";
import { TERRITORIES, FRAMEWORK_TERRITORY, FRAMEWORK_ROUTES } from "@/lib/framework-map";

// The map is a single painted illustration, hosted in Supabase Storage
// (not bundled as a Next.js static asset , see TERRAIN_MAP_URL) , commissioned
// via an image generator from a prompt naming every real territory and its
// exact signage text, then hand-verified against lib/framework-map.ts for
// accuracy before shipping.
//
// Interaction model: one tappable zone per painted sign (7 territories, not
// one per framework). Tapping a sign opens a small popover listing that
// territory's real frameworks; tapping a framework in the popover jumps to
// its card in the index below. Earlier this used one marker per framework
// (19 of them) placed directly on the image , fine on a wide desktop canvas,
// unreadable crammed onto a phone-width image. Territory zones match what's
// actually painted on the art, so the same interaction works at any size
// without a separate mobile layout.
const TERRAIN_MAP_URL =
  "https://puvfoarakheoyhkvmyef.supabase.co/storage/v1/object/public/site-assets/terrain-map.jpg";

type TerritoryId = (typeof TERRITORIES)[number]["id"];

// Where each territory's pin sits, in percent-of-image units.
//
// Measured against the source artwork at its native 1402x1122, then set so
// the pin hangs DIRECTLY BELOW that territory's painted sign rather than
// floating near it. `cx` is the horizontal centre of the signboard; `cy` is
// just under its lower edge. The marker is centre-anchored
// (translate(-50%,-50%)), so these are pin centres, not top-left corners.
//
// Previous values were eyeballed and drifted badly: several pins sat closer
// to a neighbouring sign than to their own, which made the map read as
// decorative rather than as a set of labelled controls.
const TERRITORY_SPOT: Record<TerritoryId, { cx: number; cy: number }> = {
  // Arch banner spans x 650-870, lower edge ~y 300.
  summit: { cx: 54, cy: 29 },
  // Standing stone spans x 420-540, base ~y 600.
  valley: { cx: 34, cy: 55 },
  // Hanging banner spans x 60-280, tassels end ~y 740.
  fog: { cx: 12, cy: 68 },
  // Signpost board spans x 640-810, board bottom ~y 650 (above the post).
  crossroads: { cx: 51.5, cy: 60 },
  // Board spans x 1015-1165, lower edge ~y 580.
  flatlands: { cx: 78, cy: 54 },
  // Board spans x 290-500 and its lower edge sits at ~y 1085, closer to the
  // frame bottom than the other signs. The pin hangs just under it and rides
  // the bottom edge of the canvas, which is why this one is not clear of the
  // frame the way the others are.
  swamp: { cx: 28, cy: 98 },
  // Board spans x 1105-1265, lower edge ~y 985.
  "frozen-lake": { cx: 84.5, cy: 90 },
};

export function FrameworkTerrainMap({ frameworks }: { frameworks: Framework[] }) {
  const [openTerritory, setOpenTerritory] = useState<TerritoryId | null>(null);
  const [activeFramework, setActiveFramework] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const frameworksBySlug = useMemo(
    () => new Map(frameworks.map((f) => [f.slug, f])),
    [frameworks]
  );

  // Real frameworks grouped by territory, filtered to what's actually live
  // in Supabase , a slug in FRAMEWORK_TERRITORY with no matching row simply
  // never appears, rather than showing a broken entry.
  const frameworksByTerritory = useMemo(() => {
    const bySlug = new Map<TerritoryId, Framework[]>();
    for (const [slug, territory] of Object.entries(FRAMEWORK_TERRITORY)) {
      const framework = frameworksBySlug.get(slug);
      if (!framework) continue;
      const list = bySlug.get(territory as TerritoryId) ?? [];
      list.push(framework);
      bySlug.set(territory as TerritoryId, list);
    }
    return bySlug;
  }, [frameworksBySlug]);

  // Close the open popover on an outside click/tap or Escape , a popover
  // stuck open until you happen to tap another sign reads as broken.
  useEffect(() => {
    if (!openTerritory) return;
    function handlePointerDown(e: PointerEvent) {
      if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
        setOpenTerritory(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenTerritory(null);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openTerritory]);

  // Jump to this framework's card in the Framework Index list further down
  // and give it a brief highlight ring , a direct DOM lookup by id, no
  // lifted state or context provider needed for a one-shot scroll + timed
  // class toggle.
  function selectFramework(slug: string) {
    setActiveFramework(slug);
    setOpenTerritory(null);
    const target = document.getElementById(`framework-index-${slug}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.classList.add("is-map-highlighted");
    window.setTimeout(() => target.classList.remove("is-map-highlighted"), 1500);
  }

  const activeFrameworkData = activeFramework ? frameworksBySlug.get(activeFramework) ?? null : null;
  const activeRoutes = activeFramework
    ? FRAMEWORK_ROUTES.filter((r) => r.from === activeFramework && frameworksBySlug.has(r.to))
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label">Framework Map</p>
        <p className="mt-1 text-sm text-ink-dim">
          Tap a location on the map to see the tools that live there. Every
          trail climbs toward Fortissimo Summit.
        </p>
      </div>

      <div className="terrain-scroll">
        <div
          ref={canvasRef}
          className="terrain-canvas relative w-full"
          style={{ aspectRatio: "1402 / 1122" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TERRAIN_MAP_URL}
            alt="An illustrated map: a winding path climbs from Waffle Swamp, Self-Doubt Fog, Lonely Lake, The Shrinking Valley, The Flatlands, and The Crossroads up to Fortissimo Summit."
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />

          {TERRITORIES.map((territory) => {
            const spot = TERRITORY_SPOT[territory.id];
            const territoryFrameworks = frameworksByTerritory.get(territory.id) ?? [];
            const isOpen = openTerritory === territory.id;
            const vertical = spot.cy < 45 ? "below" : "above";
            const horizontal = spot.cx < 35 ? "right" : spot.cx > 65 ? "left" : "center";

            return (
              <div key={territory.id} className="absolute" style={{ left: `${spot.cx}%`, top: `${spot.cy}%` }}>
                <button
                  type="button"
                  className={`territory-marker${isOpen ? " is-open" : ""}${
                    territory.id === "summit" ? " is-summit" : ""
                  }`}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenTerritory((current) => (current === territory.id ? null : territory.id))
                  }
                >
                  <span className="sr-only">{territory.name}</span>
                  <span className="territory-marker-dot" />
                </button>

                {isOpen && (
                  <div
                    className={`territory-popover territory-popover--${vertical} territory-popover--${horizontal}`}
                    role="menu"
                  >
                    <p className="territory-popover-title">{territory.name}</p>
                    {territoryFrameworks.length === 0 ? (
                      <p className="territory-popover-empty">No tools logged here yet.</p>
                    ) : (
                      territoryFrameworks.map((framework) => (
                        <button
                          key={framework.id}
                          type="button"
                          role="menuitem"
                          className="territory-popover-item"
                          onClick={() => selectFramework(framework.slug)}
                        >
                          {framework.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div id="terrain-map-panel" className="card p-5" aria-live="polite">
        {activeFrameworkData ? (
          <>
            <h3 className="font-display text-lg text-ink">{activeFrameworkData.name}</h3>
            {activeFrameworkData.summary && (
              <p className="mt-1 text-base text-ink-dim">{activeFrameworkData.summary}</p>
            )}
            {activeFrameworkData.steps.length > 0 && (
              <ol className="mt-3 flex flex-col gap-1.5">
                {activeFrameworkData.steps.map((step, i) => (
                  <li key={i} className="text-base text-ink">
                    <span className="mr-2 font-mono text-sm text-gold">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {activeRoutes.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-paper-line pt-3">
                {activeRoutes.map((r) => {
                  const dest = frameworksBySlug.get(r.to);
                  if (!dest) return null;
                  return (
                    <li key={r.to} className="text-sm text-ink-dim">
                      <span className="text-gold">→ {dest.name}:</span> {r.note}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="label">Terrain key</p>
            <ul className="mt-3 flex flex-col gap-2">
              {TERRITORIES.map((t) => (
                <li key={t.id} className="text-sm text-ink-dim">
                  <span className="text-ink">{t.name}:</span> {t.blurb}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
