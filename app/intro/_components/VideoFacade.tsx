"use client";

import { useState } from "react";

// Click-to-play YouTube. Shows the video's own thumbnail and loads the
// player only when tapped, so seven embeds cost seven small images on
// load instead of seven YouTube players.
export default function VideoFacade({ id, label }: { id: string; label: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-md bg-ttw-charcoal">
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
            title={label}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ttw-copper"
            aria-label={`Play client video: ${label}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              width={480}
              height={360}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-ttw-charcoal/25 transition-colors group-hover:bg-ttw-charcoal/10" />
            <span className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ttw-cream/95 shadow-md">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-6 w-6 fill-ttw-copper">
                <path d="M7 4.5v15l13-7.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="font-ttw-serif text-lg leading-snug text-ttw-charcoal">
        &ldquo;{label}&rdquo;
      </figcaption>
    </figure>
  );
}
