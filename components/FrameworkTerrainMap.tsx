"use client";

import { useMemo, useState } from "react";
import type { Framework } from "@/lib/data";
import { TERRITORIES, FRAMEWORK_TERRITORY, FRAMEWORK_ROUTES } from "@/lib/framework-map";

// Intrinsic canvas size in SVG viewBox units. Node/label positions are
// computed once in this coordinate space, then placed with the HTML
// overlay using percentages of it — so the whole map scales as one piece
// regardless of rendered width, with no per-framework hotspot coordinates
// hand-picked against a flat image.
const VB_W = 1440;
const VB_H = 1160;

type TerritoryId = (typeof TERRITORIES)[number]["id"];

// Where each terrain feature sits. Fortissimo Summit is the one true peak
// (smallest cy = highest on the canvas); the six stuck-state regions sit
// lower around it, in two generously spaced rows, so every climbing route
// visibly reads uphill and each region's ambient label has clear air above
// its own hill instead of crowding into a neighbor's.
const TERRAIN_LAYOUT: Record<TerritoryId, { cx: number; cy: number; rx: number; ry: number }> = {
  summit: { cx: 760, cy: 170, rx: 140, ry: 100 },
  swamp: { cx: 260, cy: 560, rx: 190, ry: 130 },
  flatlands: { cx: 760, cy: 560, rx: 150, ry: 100 },
  "frozen-lake": { cx: 1160, cy: 560, rx: 170, ry: 120 },
  valley: { cx: 260, cy: 980, rx: 170, ry: 120 },
  fog: { cx: 760, cy: 1000, rx: 150, ry: 90 },
  crossroads: { cx: 1160, cy: 980, rx: 170, ry: 120 },
};

// One hand-picked asymmetry pattern per ground-level region so each hill
// silhouette reads as organic rather than a perfect ellipse — deterministic
// (no Math.random) so server/client output can never mismatch.
const HILL_JITTER: Record<Exclude<TerritoryId, "summit">, number[]> = {
  swamp: [1, 0.88, 1.1, 0.92, 1.06, 0.85, 1.12, 0.95],
  fog: [0.92, 1.08, 0.9, 1.14, 0.88, 1.05, 0.94, 1.1],
  "frozen-lake": [1.1, 0.9, 1.05, 0.88, 1.12, 0.92, 1.02, 0.96],
  valley: [0.95, 1.12, 0.86, 1.08, 0.98, 1.15, 0.88, 1.04],
  flatlands: [1.05, 0.92, 1.1, 0.9, 1.02, 1.08, 0.94, 1.12],
  crossroads: [0.9, 1.06, 0.94, 1.1, 0.86, 1.04, 1.12, 0.96],
};

/** A closed, softly irregular blob path — flat hand-drawn hill silhouette,
 * not a perfect ellipse, matching bamboo.svg's flat-shape illustration style. */
function blobPath(cx: number, cy: number, rx: number, ry: number, jitter: number[]) {
  const n = jitter.length;
  const pts = jitter.map((r, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r];
  });
  let d = `M ${(pts[0][0] + pts[n - 1][0]) / 2} ${(pts[0][1] + pts[n - 1][1]) / 2}`;
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    d += ` Q ${cur[0]} ${cur[1]} ${mid[0]} ${mid[1]}`;
  }
  return d + " Z";
}

/** Evenly spaced points on a ring inside a territory, so node placement is
 * computed from how many frameworks live there, not hand-picked per slug. */
function ringPositions(cx: number, cy: number, rx: number, ry: number, count: number) {
  if (count <= 0) return [];
  if (count === 1) return [{ x: cx, y: cy }];
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    points.push({ x: cx + Math.cos(angle) * rx * 0.6, y: cy + Math.sin(angle) * ry * 0.6 });
  }
  return points;
}

/** A curved trail between two nodes, bowed perpendicular to the line so
 * routes read as hand-drawn paths rather than ruler-straight connectors. */
function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bow = Math.min(70, len * 0.22);
  const cx = mx + nx * bow;
  const cy = my + ny * bow;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function FrameworkTerrainMap({ frameworks }: { frameworks: Framework[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = focused ?? hovered;

  const frameworksBySlug = useMemo(
    () => new Map(frameworks.map((f) => [f.slug, f])),
    [frameworks]
  );

  // Node positions come from the fixed territory graph, not from the live
  // Supabase rows — a framework slug that doesn't appear in the map data
  // simply never gets a position, and is skipped below rather than crashing.
  const nodePositions = useMemo(() => {
    const bySlug = new Map<string, { x: number; y: number; territory: TerritoryId }>();
    const slugsByTerritory = new Map<TerritoryId, string[]>();
    for (const [slug, territory] of Object.entries(FRAMEWORK_TERRITORY)) {
      const list = slugsByTerritory.get(territory) ?? [];
      list.push(slug);
      slugsByTerritory.set(territory, list);
    }
    for (const territory of TERRITORIES) {
      const slugs = slugsByTerritory.get(territory.id) ?? [];
      const layout = TERRAIN_LAYOUT[territory.id];
      const points = ringPositions(layout.cx, layout.cy, layout.rx, layout.ry, slugs.length);
      slugs.forEach((slug, i) => {
        bySlug.set(slug, { x: points[i].x, y: points[i].y, territory: territory.id });
      });
    }
    return bySlug;
  }, []);

  const visibleFrameworks = frameworks.filter((f) => nodePositions.has(f.slug));

  const routes = useMemo(
    () =>
      FRAMEWORK_ROUTES.filter(
        (r) =>
          nodePositions.has(r.from) &&
          nodePositions.has(r.to) &&
          frameworksBySlug.has(r.from) &&
          frameworksBySlug.has(r.to)
      ).map((r) => {
        const from = nodePositions.get(r.from)!;
        const to = nodePositions.get(r.to)!;
        return { ...r, path: curvePath(from.x, from.y, to.x, to.y) };
      }),
    [nodePositions, frameworksBySlug]
  );

  const activeFramework = active ? frameworksBySlug.get(active) ?? null : null;
  const activeRoutes = active ? routes.filter((r) => r.from === active) : [];
  const groundTerritories = TERRITORIES.filter(
    (t): t is typeof TERRITORIES[number] & { id: Exclude<TerritoryId, "summit"> } => t.id !== "summit"
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="label">Framework Map</p>
        <p className="mt-1 text-sm text-paper-dim">
          Tab or hover over a location to see what it does and where it
          leads. Every trail climbs toward Fortissimo Summit.
        </p>
      </div>

      <div className="terrain-scroll overflow-x-auto rounded-xl border border-ink-line p-4">
        <div
          className="terrain-canvas relative w-full"
          style={{ aspectRatio: `${VB_W} / ${VB_H}`, minWidth: "820px" }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* ambient trail sweeping up from the lower ground toward the peak */}
            <path
              d="M 120 1080 Q 260 940 300 760 Q 400 600 550 480 Q 680 320 760 170"
              className="terrain-ambient-trail"
            />

            {/* six ground-level regions: flat hill silhouettes with
                topographic contour rings, echoing bamboo.svg's flat-shape,
                layered-opacity language */}
            {groundTerritories.map((t) => {
              const layout = TERRAIN_LAYOUT[t.id];
              const jitter = HILL_JITTER[t.id];
              return (
                <g key={t.id}>
                  <path
                    d={blobPath(layout.cx, layout.cy, layout.rx, layout.ry, jitter)}
                    className="terrain-hill"
                  />
                  <path
                    d={blobPath(layout.cx, layout.cy, layout.rx * 0.72, layout.ry * 0.72, jitter)}
                    className="terrain-contour terrain-contour-mid"
                  />
                  <path
                    d={blobPath(layout.cx, layout.cy, layout.rx * 0.44, layout.ry * 0.44, jitter)}
                    className="terrain-contour terrain-contour-inner"
                  />
                </g>
              );
            })}

            {/* Fortissimo Summit: a real peak, not another hill — the one
                shared destination every route climbs toward */}
            {(() => {
              const s = TERRAIN_LAYOUT.summit;
              return (
                <g>
                  <path
                    d={`M ${s.cx - 150} ${s.cy + 110} L ${s.cx - 46} ${s.cy - 80} L ${s.cx - 6} ${s.cy - 130} L ${s.cx + 36} ${s.cy - 78} L ${s.cx + 150} ${s.cy + 110} Z`}
                    className="terrain-summit-back"
                  />
                  <path
                    d={`M ${s.cx - 96} ${s.cy + 110} L ${s.cx - 10} ${s.cy - 130} L ${s.cx + 78} ${s.cy + 110} Z`}
                    className="terrain-summit-front"
                  />
                  <path
                    d={`M ${s.cx - 26} ${s.cy - 62} L ${s.cx - 10} ${s.cy - 130} L ${s.cx + 20} ${s.cy - 58} Z`}
                    className="terrain-summit-cap"
                  />
                  <path d={`M ${s.cx - 60} ${s.cy - 10} q 40 -14 76 4`} className="terrain-summit-line" />
                  <path d={`M ${s.cx - 78} ${s.cy + 40} q 56 -18 108 4`} className="terrain-summit-line" />
                </g>
              );
            })()}

            {/* functional routes: curved trails between real frameworks */}
            {routes.map((r) => (
              <path
                key={`${r.from}->${r.to}`}
                d={r.path}
                className={`terrain-route${active === r.from ? " is-active" : ""}`}
              />
            ))}
          </svg>

          {/* ambient territory labels — decorative text only, never a
              second clickable layer */}
          {TERRITORIES.map((t) => {
            const layout = TERRAIN_LAYOUT[t.id];
            return (
              <div
                key={t.id}
                className="terrain-label pointer-events-none absolute"
                style={{
                  left: `${(layout.cx / VB_W) * 100}%`,
                  top: `${((layout.cy - layout.ry - 22) / VB_H) * 100}%`,
                }}
              >
                <p className="terrain-label-name">{t.name}</p>
                <p className="terrain-label-blurb">{t.blurb}</p>
              </div>
            );
          })}

          {/* real, focusable location markers */}
          {visibleFrameworks.map((framework) => {
            const pos = nodePositions.get(framework.slug)!;
            const territory = TERRITORIES.find((t) => t.id === pos.territory);
            const isActive = active === framework.slug;
            return (
              <button
                key={framework.id}
                type="button"
                className={`map-node absolute${isActive ? " is-active" : ""}${
                  pos.territory === "summit" ? " is-summit" : ""
                }`}
                style={{ left: `${(pos.x / VB_W) * 100}%`, top: `${(pos.y / VB_H) * 100}%` }}
                onMouseEnter={() => setHovered(framework.slug)}
                onMouseLeave={() => setHovered((h) => (h === framework.slug ? null : h))}
                onFocus={() => setFocused(framework.slug)}
                onBlur={() => setFocused((f) => (f === framework.slug ? null : f))}
                aria-describedby="terrain-map-panel"
              >
                <span className="map-node-dot" />
                <span className="map-node-label">
                  {framework.name}
                  <span className="sr-only"> — {territory?.name ?? "unmapped"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-paper-dim sm:hidden">
        Scroll sideways to explore the full map →
      </p>

      <div id="terrain-map-panel" className="card p-5" aria-live="polite">
        {activeFramework ? (
          <>
            <h3 className="font-display text-lg text-paper">{activeFramework.name}</h3>
            {activeFramework.summary && (
              <p className="mt-1 text-base text-paper-dim">{activeFramework.summary}</p>
            )}
            {activeFramework.steps.length > 0 && (
              <ol className="mt-3 flex flex-col gap-1.5">
                {activeFramework.steps.map((step, i) => (
                  <li key={i} className="text-base text-paper">
                    <span className="mr-2 font-mono text-sm text-brass">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {activeRoutes.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2 border-t border-ink-line pt-3">
                {activeRoutes.map((r) => {
                  const dest = frameworksBySlug.get(r.to);
                  if (!dest) return null;
                  return (
                    <li key={r.to} className="text-sm text-paper-dim">
                      <span className="text-brass">→ {dest.name}:</span> {r.note}
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
                <li key={t.id} className="text-sm text-paper-dim">
                  <span className="text-paper">{t.name}:</span> {t.blurb}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
