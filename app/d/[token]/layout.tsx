import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientByToken, getFirstSessionDate } from "@/lib/data";
import { DashboardNav } from "@/components/DashboardNav";
import { Sidebar } from "@/components/Sidebar";
import { computeProgramTimeline } from "@/lib/timeline";
import { MissionTimeline } from "@/components/MissionTimeline";
import { IdentityPlacard } from "@/components/IdentityPlacard";
import { AscentLight } from "@/components/AscentLight";

export async function generateMetadata(
  props: LayoutProps<"/d/[token]">
): Promise<Metadata> {
  const { token } = await props.params;
  const client = await getClientByToken(token);

  if (!client) {
    return { title: "Moment Makers" };
  }

  return {
    title: `${client.identity_names?.[0] ?? client.name} · Moment Makers`,
  };
}

export default async function DashboardLayout(
  props: LayoutProps<"/d/[token]">
) {
  const { token } = await props.params;
  const client = await getClientByToken(token);

  if (!client) {
    notFound();
  }

  const startedOn = await getFirstSessionDate(client.id);
  const timeline =
    startedOn && client.target_date
      ? computeProgramTimeline(startedOn, client.target_date)
      : null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-md focus:bg-paper-raised focus:px-4 focus:py-2 focus:text-base focus:text-lacquer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-lacquer"
      >
        Skip to content
      </a>
      <div className="lg:flex lg:min-h-full lg:items-start">
        <Sidebar token={token} clientName={client.identity_names?.[0] ?? client.name} />
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10 lg:max-w-none lg:px-10">
          <header className="flex flex-col gap-4">
            <div className="flex items-baseline gap-3 lg:hidden">
              {/* Bamboo above the fold: a small, modest header accent using
                  the same grove illustration as the full valley-floor scene
                  at the bottom of the page, so the motif reads as present
                  on load instead of only after scrolling to the very bottom.
                  Hidden on lg+ since the sidebar already carries the brand
                  mark and client name. */}
              <img
                src="/bamboo.svg"
                alt=""
                aria-hidden="true"
                className="h-12 w-auto flex-none opacity-90 sm:h-14"
              />
              <span className="forte-mark text-3xl">𝑓𝑓</span>
              <div>
                {/* The identity word lives in the placard directly below on
                    every route, so this mobile header carries the program
                    only. Repeating the word here stacked it twice. */}
                <h1 className="label">{client.program}</h1>
              </div>
            </div>

            {client.identity_names?.[0] && (
              <div className="identity-placard-wrap">
                <IdentityPlacard
                  word={client.identity_names[0]}
                  accent={client.accent_hex}
                  token={token}
                />
              </div>
            )}

            {timeline && <MissionTimeline timeline={timeline} />}

            <DashboardNav token={token} />
          </header>
          <main id="main-content" className="flex-1">{props.children}</main>
          <AscentLight />

          {/* Signature valley-floor scene: normal document flow inside the
              content column, so it fills the page below the content
              without stretching under the fixed-width sidebar. */}
          <div className="valley-floor" aria-hidden="true">
            <img src="/valley-floor.svg" alt="" className="valley-floor-img" />
          </div>
        </div>
      </div>
    </>
  );
}
