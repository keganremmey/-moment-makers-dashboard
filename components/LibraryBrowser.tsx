"use client";

import { useMemo, useState } from "react";
import type { Framework, Quote } from "@/lib/data";

export function LibraryBrowser({
  frameworks,
  quotes,
}: {
  frameworks: Framework[];
  quotes: Quote[];
}) {
  const [query, setQuery] = useState("");

  const filteredFrameworks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return frameworks;
    return frameworks.filter((f) =>
      [f.name, f.summary ?? "", ...f.steps].join(" ").toLowerCase().includes(q)
    );
  }, [frameworks, query]);

  const filteredQuotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter((quote) =>
      [quote.text, quote.attributed_to ?? "", quote.context ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [quotes, query]);

  return (
    <div className="flex flex-col gap-8">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search frameworks and quotes…"
        className="rounded-lg border border-ink-line bg-ink-raised px-4 py-2.5 text-base text-paper placeholder:text-paper-dim focus:border-brass-dim focus:outline-none"
      />

      <section>
        <p className="label mb-3">Frameworks</p>
        {filteredFrameworks.length === 0 ? (
          <p className="text-base text-paper-dim">No matching frameworks.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFrameworks.map((framework) => (
              <article key={framework.id} className="card p-5">
                <h3 className="font-display text-lg text-paper">
                  {framework.name}
                </h3>
                {framework.summary && (
                  <p className="mt-1 text-base text-paper-dim">
                    {framework.summary}
                  </p>
                )}
                {framework.steps.length > 0 && (
                  <ol className="mt-3 flex flex-col gap-1.5">
                    {framework.steps.map((step, i) => (
                      <li key={i} className="text-base text-paper">
                        <span className="mr-2 font-mono text-sm text-brass">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <p className="label mb-3">Quotes</p>
        {filteredQuotes.length === 0 ? (
          <p className="text-base text-paper-dim">No matching quotes.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQuotes.map((quote) => (
              <blockquote
                key={quote.id}
                className="card border-l-2 border-l-brass p-5"
              >
                <p className="font-accent text-xl italic leading-snug text-paper">
                  “{quote.text}”
                </p>
                <footer className="mt-2 text-xs text-paper-dim">
                  {quote.attributed_to && <span>— {quote.attributed_to}</span>}
                  {quote.context && <span> · {quote.context}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
