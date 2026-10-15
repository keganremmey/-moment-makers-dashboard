"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./body.module.css";
import { LETTERS, PATTERN_BY_LETTER, QUESTIONS, type Letter, type Pattern } from "./questions";

// Same 4 questions, letters, and scoring as the live event quiz (version
// "event-v1"), so results, GoHighLevel tags, texts, and emails come out
// identical.
//
// Event flow: details first. The person gets in line for bodywork the second
// they tap the button (the new bup_results row fires the "in line" webhook to
// GoHighLevel), then the same card fades into question 1. If they wander off
// mid-quiz, the next-day text carries /body?r={id}, which drops them straight
// back into the questions with their spot already saved.
const VERSION = "event-v1";
const LEAD_KEY = "bup_event_lead";
const LEAD_TTL_MS = 12 * 60 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIEBREAK_TEXT: Record<Pattern, string> = {
  HOLDER: "My body stays tight and braced after the moment is over.",
  DRIVER: "I have a hard time stopping. I go straight to the next thing.",
  COMPENSATOR: "One part of my body keeps doing more than its share.",
  OVERRIDER: "I notice how my body feels later, not while it's happening.",
};

function tiedTopPatterns(answers: Letter[]): Pattern[] {
  const counts: Record<Pattern, number> = { HOLDER: 0, DRIVER: 0, COMPENSATOR: 0, OVERRIDER: 0 };
  answers.forEach((a) => (counts[PATTERN_BY_LETTER[a]] += 1));
  const max = Math.max(...Object.values(counts));
  const top = (Object.keys(counts) as Pattern[]).filter((p) => counts[p] === max);
  return top.length > 1 ? top : [];
}

function getSessionId(): string {
  try {
    let id = window.localStorage.getItem("bup_session_id");
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem("bup_session_id", id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

type SavedLead = { id: string; firstName: string };

function saveLead(lead: SavedLead) {
  try {
    window.localStorage.setItem(LEAD_KEY, JSON.stringify({ ...lead, at: Date.now() }));
  } catch {}
}

function clearLead() {
  try {
    window.localStorage.removeItem(LEAD_KEY);
  } catch {}
}

// A lead from the resume link wins; otherwise a lead this phone saved in the
// last 12 hours (a refresh mid-quiz should not ask for details twice).
function findLead(): SavedLead | null {
  const fromUrl = new URLSearchParams(window.location.search).get("r") ?? "";
  if (UUID_RE.test(fromUrl)) return { id: fromUrl, firstName: "" };
  try {
    const raw = window.localStorage.getItem(LEAD_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedLead & { at?: number };
    if (!saved.id || !UUID_RE.test(saved.id) || !saved.at || Date.now() - saved.at > LEAD_TTL_MS) return null;
    return { id: saved.id, firstName: saved.firstName ?? "" };
  } catch {
    return null;
  }
}

// Rotate answer order per question so position never predicts a pattern.
const ORDER: Letter[][] = QUESTIONS.map((_, i) => LETTERS.map((_, j) => LETTERS[(i + 1 + j) % 4]));

function getEventTag(): string | undefined {
  const raw = new URLSearchParams(window.location.search).get("e") ?? "";
  const tag = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  return tag || undefined;
}

function track(event: string, sessionId: string, props: Record<string, unknown> = {}, resultId: string | null = null) {
  const body = JSON.stringify({ event, sessionId, resultId, props: { version: VERSION, ...props } });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/body/track", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch {}
  fetch("/api/body/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

function isValidPhone(value: string): boolean {
  const digits = value.trim().replace(/[\s\-.()]/g, "");
  const bare = digits.startsWith("+") ? digits.slice(1) : digits;
  return /^\d{10,15}$/.test(bare);
}

type Phase = "loading" | "contact" | "questions" | "tiebreak" | "finishing";

export default function BodyQuiz() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [lead, setLead] = useState<SavedLead | null>(null);
  const [justJoined, setJustJoined] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Letter[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [tied, setTied] = useState<Pattern[]>([]);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const finalAnswers = useRef<{ answers: Letter[]; tieBreak?: Pattern } | null>(null);
  const started = useRef(false);
  const contactStarted = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef("");
  const sid = () => (sessionRef.current ||= getSessionId());

  useEffect(() => {
    const existing = findLead();
    track("landing_page_view", sid(), { resumed: Boolean(existing) }, existing?.id ?? null);
    // Reading the URL and localStorage only works after mount, so the first
    // phase is decided here rather than during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existing) {
      setLead(existing);
      setPhase("questions");
    } else {
      setPhase("contact");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function scrollToCard() {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onFieldFocus() {
    if (!contactStarted.current) {
      contactStarted.current = true;
      track("contact_form_started", sid());
    }
  }

  async function joinLine(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const next: Record<string, string> = {};
    const name = firstName.trim();
    if (name.length < 1 || name.length > 60) next.firstName = "Enter your first name.";
    if (!isValidPhone(phone)) next.phone = "Enter a phone number so Kegan can text you when you're up.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "That email looks off. Fix it or leave it blank.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/body/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: name, email: email.trim(), phone: phone.trim(), sessionId: sid(), company, version: VERSION }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) {
        setFormError(
          data.suppressed
            ? "Something went wrong saving your details. Please try again, and type your details instead of using autofill."
            : (data.error ?? "Something went wrong. Please try again."),
        );
        setSubmitting(false);
        return;
      }
      const saved = { id: data.id as string, firstName: name };
      saveLead(saved);
      setLead(saved);
      track("contact_form_completed", sid(), {}, saved.id);
      setJustJoined(true);
      setSubmitting(false);
      setPhase("questions");
      scrollToCard();
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  async function finish(all: Letter[], tieBreak?: Pattern) {
    if (!lead) return;
    finalAnswers.current = { answers: all, tieBreak };
    setFinishError(null);
    setPhase("finishing");
    scrollToCard();
    try {
      const res = await fetch("/api/body/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          answers: all,
          sessionId: sid(),
          version: VERSION,
          tieBreakChoice: tieBreak,
          eventTag: getEventTag(),
        }),
      });
      // 409 means this lead already finished (an earlier tab, a double tap);
      // the report exists either way.
      if (!res.ok && res.status !== 409) {
        const data = await res.json().catch(() => ({}));
        setFinishError(data.error ?? "Something went wrong scoring your answers.");
        return;
      }
      clearLead();
      router.push(`/body/r/${lead.id}`);
    } catch {
      setFinishError("Something went wrong. Check your connection and try again.");
    }
  }

  function answer(letter: Letter) {
    if (picked) return;
    if (!started.current) {
      started.current = true;
      track("assessment_started", sid(), { leadId: lead?.id ?? null }, lead?.id ?? null);
    }
    track("question_answered", sid(), { question: QUESTIONS[index].id, letter }, lead?.id ?? null);
    setPicked(letter);
    const next = [...answers.slice(0, index), letter];
    window.setTimeout(() => {
      setPicked(null);
      setJustJoined(false);
      setAnswers(next);
      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1);
        scrollToCard();
        return;
      }
      const ties = tiedTopPatterns(next);
      if (ties.length > 0) {
        setTied(ties);
        setPhase("tiebreak");
        scrollToCard();
      } else {
        finish(next);
      }
    }, 260);
  }

  function chooseTie(p: Pattern) {
    if (picked) return;
    setPicked(p);
    window.setTimeout(() => {
      setPicked(null);
      finish(answers, p);
    }, 260);
  }

  function back() {
    if (phase === "tiebreak") {
      setTied([]);
      setPhase("questions");
      setIndex(QUESTIONS.length - 1);
      return;
    }
    if (phase === "questions" && index > 0) setIndex(index - 1);
  }

  if (phase === "loading") {
    return <div ref={cardRef} className={`${styles.card} ${styles.cardLoading}`} aria-busy="true" />;
  }

  const q = QUESTIONS[index];
  const inQuiz = phase === "questions" || phase === "tiebreak";
  const step = phase === "questions" ? index + 1 : QUESTIONS.length;
  const pct = Math.round(((phase === "questions" ? index : QUESTIONS.length) / QUESTIONS.length) * 100);
  const stepKey = phase === "questions" ? `q${index}` : phase;

  return (
    <div ref={cardRef} className={styles.card}>
      <div key={stepKey} className={styles.step}>
        {phase === "contact" && (
          <form onSubmit={joinLine} noValidate className={styles.form}>
            <h2 className={styles.prompt}>Get in line for your free bodywork</h2>
            <p className={styles.formNote}>
              Drop your details to hold your spot on Kegan&apos;s table. Then 4 quick taps show you the pattern behind the tight spot that keeps coming back.
            </p>

            <label className={styles.label}>
              First Name
              <input className={styles.input} value={firstName} onChange={(e) => setFirstName(e.target.value)} onFocus={onFieldFocus} autoComplete="given-name" />
              {errors.firstName && <span className={styles.err}>{errors.firstName}</span>}
            </label>
            <label className={styles.label}>
              Phone
              <input className={styles.input} value={phone} onChange={(e) => setPhone(e.target.value)} onFocus={onFieldFocus} type="tel" inputMode="tel" autoComplete="tel" />
              {errors.phone && <span className={styles.err}>{errors.phone}</span>}
            </label>
            <label className={styles.label}>
              <span>
                Email <span className={styles.optional}>(for your full report)</span>
              </span>
              <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} onFocus={onFieldFocus} type="email" inputMode="email" autoComplete="email" />
              {errors.email && <span className={styles.err}>{errors.email}</span>}
            </label>
            <label className={styles.honeypot} aria-hidden="true">
              Leave this field empty
              <input tabIndex={-1} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" />
            </label>

            {formError && <p className={styles.err}>{formError}</p>}
            <button type="submit" className={styles.cta} disabled={submitting}>
              {submitting ? "Saving your spot…" : "Get Me In Line →"}
            </button>
            <p className={styles.legal}>
              By entering your phone number, you agree to receive texts about your spot, your results, and occasional follow-up about bodywork. Msg &amp; data rates may apply. Reply STOP to opt out.
            </p>
          </form>
        )}

        {inQuiz && (
          <>
            {justJoined && lead?.firstName && (
              <p className={styles.inLine}>You&apos;re in line, {lead.firstName}. Kegan will grab you. While you wait:</p>
            )}
            <div className={styles.progressRow}>
              <span>{phase === "tiebreak" ? "Last one" : `Question ${step} of ${QUESTIONS.length}`}</span>
              <span>{pct}%</span>
            </div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${pct}%` }} />
            </div>
          </>
        )}

        {phase === "questions" && (
          <>
            <h2 className={styles.prompt}>{q.prompt}</h2>
            <div className={styles.answers}>
              {ORDER[index].map((letter) => (
                <button
                  key={`${q.id}-${letter}`}
                  type="button"
                  className={`${styles.answer} ${picked === letter ? styles.answerPicked : ""}`}
                  onClick={() => answer(letter)}
                >
                  {q.answers[letter].text}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "tiebreak" && (
          <>
            <h2 className={styles.prompt}>Which of these sounds most like you?</h2>
            <div className={styles.answers}>
              {tied.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.answer} ${picked === p ? styles.answerPicked : ""}`}
                  onClick={() => chooseTie(p)}
                >
                  {TIEBREAK_TEXT[p]}
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "finishing" && (
          <div className={styles.form}>
            <h2 className={styles.prompt}>{finishError ? "Hit a snag" : "Reading your pattern…"}</h2>
            {finishError ? (
              <>
                <p className={styles.err}>{finishError}</p>
                <button
                  type="button"
                  className={styles.cta}
                  onClick={() => finalAnswers.current && finish(finalAnswers.current.answers, finalAnswers.current.tieBreak)}
                >
                  Try Again →
                </button>
              </>
            ) : (
              <p className={styles.formNote}>It opens on this screen in a second, and we text it to you so you keep it.</p>
            )}
          </div>
        )}
      </div>

      {inQuiz && (index > 0 || phase === "tiebreak") && (
        <button type="button" className={styles.back} onClick={back}>
          ← Back
        </button>
      )}
    </div>
  );
}
