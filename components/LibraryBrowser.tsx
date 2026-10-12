"use client";

import { useMemo, useState } from "react";
import { PlayCircle } from "@phosphor-icons/react";
import type { Framework, FrameworkExample, Quote } from "@/lib/data";
import { FrameworkTerrainMap } from "@/components/FrameworkTerrainMap";
import { formatClipTime } from "@/lib/timeline";

type ResolvedExample = FrameworkExample & { fathomUrl: string };

function ExampleLink({ example }: { example: ResolvedExample }) {
  const href = `${example.fathomUrl}?timestamp=${example.start_seconds}`;
  const range =
    example.end_seconds != null
      ? `${formatClipTime(example.start_seconds)}–${formatClipTime(example.end_seconds)}`
      : formatClipTime(example.start_seconds);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="framework-example-link"
    >
      <PlayCircle size={15} weight="fill" aria-hidden="true" />
      <span>
        Want to see this in action? <span className="font-mono">{range}</span>
        {example.label ? ` — ${example.label}` : ""}
      </span>
    </a>
  );
}

export function LibraryBrowser({
  frameworks,
  quotes,
  examples,
}: {
  frameworks: Framework[];
  quotes: Quote[];
  examples: ResolvedExample[];
}) {
  const [query, setQuery] = useState("");

  const examplesByFramework = useMemo(() => {
    const map = new Map<string, ResolvedExample[]>();
    for (const e of examples) {
      const list = map.get(e.framework_id) ?? [];
      list.push(e);
      map.set(e.framework_id, list);
    }
    return map;
  }, [examples]);

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
        className="rounded-lg border border-paper-line bg-paper-raised px-4 py-2.5 text-base text-ink placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-paper"
      />

      <section>
        <FrameworkTerrainMap frameworks={frameworks} />
      </section>

      <section>
        <p className="label mb-3">Framework Index</p>
        <p className="mb-3 text-sm text-ink-dim">
          Every framework, plain-text , a reference list for searching, same
          data as the map above.
        </p>
        {filteredFrameworks.length === 0 ? (
          <p className="text-base text-ink-dim">
            {query.trim() === "" ? "No frameworks yet." : "No matching frameworks."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredFrameworks.map((framework) => {
              const frameworkExamples = examplesByFramework.get(framework.id) ?? [];
              const wholeExamples = frameworkExamples.filter((e) => e.step_index == null);
              const stepExamples = (i: number) =>
                frameworkExamples.filter((e) => e.step_index === i);

              return (
                <article
                  key={framework.id}
                  id={`framework-index-${framework.slug}`}
                  className="card p-5"
                >
                  <h3 className="font-display text-lg text-ink">
                    {framework.name}
                  </h3>
                  {framework.summary && (
                    <p className="mt-1 text-base text-ink-dim">
                      {framework.summary}
                    </p>
                  )}
                  {wholeExamples.map((e) => (
                    <ExampleLink key={e.id} example={e} />
                  ))}
                  {framework.steps.length > 0 && (
                    <ol className="mt-3 flex flex-col gap-1.5">
                      {framework.steps.map((step, i) => (
                        <li key={i} className="text-base text-ink">
                          <span className="mr-2 font-mono text-sm text-gold">
                            {i + 1}
                          </span>
                          {step}
                          {stepExamples(i).map((e) => (
                            <ExampleLink key={e.id} example={e} />
                          ))}
                        </li>
                      ))}
                    </ol>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <p className="label mb-3">Quotes</p>
        {filteredQuotes.length === 0 ? (
          <p className="text-base text-ink-dim">
            {query.trim() === "" ? "No quotes yet." : "No matching quotes."}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredQuotes.map((quote) => (
              <blockquote
                key={quote.id}
                className="card border-l-2 border-l-gold p-5"
              >
                <p className="max-w-[65ch] text-pretty font-accent text-xl italic leading-snug text-ink">
                  “{quote.text}”
                </p>
                <footer className="mt-2 text-xs text-ink-dim">
                  {quote.attributed_to && <span>{quote.attributed_to}</span>}
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
