import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { LETTERS, PATTERN_BY_LETTER, QUESTIONS, type Letter, type Pattern } from "../../questions";
import { REPORTS } from "../report-data";
import BookButton from "./BookButton";
import styles from "./report.module.css";

// Results page for the 4-question event quiz. Mirrors the copy and order of
// body.wearemomentmakers.com/r/{id}; the only change is the booking button
// label. Reads the finished result through the same bup_get_report RPC the
// body site uses.
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BODY_SITE = "https://body.wearemomentmakers.com";
const BOOKING_FALLBACK = "https://book.wearemomentmakers.com/widget/booking/8GqdiM5N0ad9d59SFwGp";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata: Metadata = {
  title: "Your Result | The Body Under Pressure Assessment",
};

type ReportRow = {
  first_name: string | null;
  primary_pattern: string;
  secondary_pattern: string | null;
  assessment_version: string;
  meta: { tiebreak_choice?: string | null } | null;
  answers: string[] | null;
};

function isPattern(p: string | null | undefined): p is Pattern {
  return p === "HOLDER" || p === "DRIVER" || p === "COMPENSATOR" || p === "OVERRIDER";
}

// Same wording the body site prints above section 01.
function strengthLine(answers: Letter[], primary: Pattern, secondary: Pattern | null, tieBreak: boolean): string {
  const name = REPORTS[primary].name;
  if (tieBreak) {
    return `Two patterns tied on your answers and you picked ${name} yourself. Trust that. You know something the quiz does not.`;
  }
  const top = answers.filter((a) => PATTERN_BY_LETTER[a] === primary).length;
  if (top >= 4 || !secondary) return "All four went the same direction. There is not much ambiguity about this one.";
  const second = REPORTS[secondary].name;
  if (top === 3) return `Three of your four answers point the same way. The fourth is where ${second} shows up in you.`;
  return `Two answers point at ${name} and the rest point at ${second}. You run both, and ${name} runs the show.`;
}

export default async function BodyReportPage(props: PageProps<"/body/r/[id]">) {
  const { id } = await props.params;
  if (!UUID.test(id)) notFound();

  const supabase = supabaseServer();
  const { data } = await supabase.rpc("bup_get_report" as never, { p_id: id } as never);
  const row = (Array.isArray(data) ? data[0] : null) as ReportRow | null;
  if (!row) notFound();
  // Anything that isn't the 4-question event quiz keeps its original report.
  if (row.assessment_version !== "event-v1" || !isPattern(row.primary_pattern)) {
    redirect(`${BODY_SITE}/r/${id}`);
  }

  // Same booking link the GoHighLevel text and email use for event takers.
  const { data: setting } = await supabase
    .from("bup_settings")
    .select("value")
    .eq("key", "event_booking_url")
    .maybeSingle();
  const bookingUrl = (setting as { value?: string } | null)?.value || BOOKING_FALLBACK;

  const primary = row.primary_pattern;
  const secondary = isPattern(row.secondary_pattern) ? row.secondary_pattern : null;
  const answers = (row.answers ?? []).filter((a): a is Letter => LETTERS.includes(a as Letter));
  const report = REPORTS[primary];
  const firstName = row.first_name?.trim() || "Friend";
  const summary = strengthLine(answers, primary, secondary, Boolean(row.meta?.tiebreak_choice));

  return (
    <div className={`${instrument.variable} ${styles.page}`}>
      <header className={styles.hero}>
        <p className={styles.kicker}>{firstName}, your Body Under Pressure Pattern is:</p>
        <h1 className={styles.pattern}>{report.name}</h1>
        <p className={styles.tagline}>{report.tagline}</p>
        <div className={styles.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BODY_SITE}/_next/image?url=%2Fv2%2Fkegan-video-poster.jpg&w=750&q=75`} alt="Kegan Remmey" />
          <div className={styles.photoShade} />
          <div className={styles.photoCaption}>
            <p className={styles.photoName}>Kegan Remmey</p>
            <p className={styles.photoRole}>Structural Bodywork</p>
          </div>
        </div>
        <BookButton href={bookingUrl} resultId={id} />
      </header>

      <article className={styles.article}>
        <Section n="00" title="What You Told Me">
          {QUESTIONS.map((q, i) => {
            const letter = answers[i];
            if (!letter) return null;
            return (
              <div key={q.id} className={styles.told}>
                <p className={styles.toldPrompt}>{q.prompt}</p>
                <p className={styles.toldAnswer}>“{q.answers[letter].text}”</p>
                <p className={styles.toldRead}>{q.answers[letter].read}</p>
              </div>
            );
          })}
          <p className={styles.summary}>{summary}</p>
        </Section>

        <Section n="01" title="Sound Familiar?">
          {report.familiar.map((line, i) =>
            line === "Real talk." ? (
              <p key={i} className={styles.realTalk}>Real talk.</p>
            ) : (
              <p key={i} className={report.familiar[i - 1] === "Real talk." ? styles.punch : styles.para}>
                {line}
              </p>
            ),
          )}
        </Section>

        <Section n="02" title="What It's Costing You">
          <ol className={styles.costs}>
            {report.costs.map((c, i) => (
              <li key={i}>
                <span className={styles.costNum}>{i + 1}</span>
                <div>
                  <p className={styles.costTitle}>
                    <strong>{c.title}</strong>
                    {c.tail}
                  </p>
                  {c.detail && <p className={styles.costDetail}>{c.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section n="03" title="What You're Building">
          <p className={styles.capLabel}>The Capacity To Build</p>
          <p className={styles.capacity}>{report.capacity}</p>
          {report.building.map((b, i) =>
            typeof b === "string" ? (
              <p key={i} className={typeof report.building[i - 1] === "object" ? styles.question : styles.para}>
                {b}
              </p>
            ) : (
              <p key={i} className={styles.capLabel}>
                {b.label}:
              </p>
            ),
          )}
        </Section>

        <Section n="04" title="Your Body Compass">
          <div className={styles.compass}>
            {report.compass.map((c) => (
              <div key={c.key} className={styles.compassCard}>
                <p className={styles.compassKey}>{c.key}</p>
                <p className={styles.compassTitle}>{c.title}</p>
                <p className={styles.para}>{c.body}</p>
                <p className={styles.compassNote}>{c.note}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section n="05" title="Where This Goes">
          <ol className={styles.map}>
            {report.map.map((step, i) => (
              <li key={step}>
                {i > 0 && <span className={styles.arrow}>↓</span>}
                <span className={i === report.map.length - 1 ? styles.mapEnd : styles.mapStep}>{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        <Section n="06" title="Come Get Your Hands On It">
          {report.cta.map((line, i) => (
            <p key={i} className={styles.para}>
              {line}
            </p>
          ))}
          <div className={styles.endCta}>
            <BookButton href={bookingUrl} resultId={id} />
            <a className={styles.pdf} href={`${BODY_SITE}/r/${id}/pdf`}>
              Download My Report (PDF)
            </a>
          </div>
        </Section>
      </article>

      <footer className={styles.footer}>
        <a href={`${BODY_SITE}/privacy`}>Privacy</a>
        <span>Moment Makers · Kegan Remmey · Structural Bodywork</span>
      </footer>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionNum}>{n}</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}
