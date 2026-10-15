"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./body.module.css";

// Same 4 questions, letters, and scoring as the live event quiz at
// body.wearemomentmakers.com/q/assessment (version "event-v1"), so results,
// GoHighLevel tags, texts, and emails come out identical.
type Letter = "A" | "B" | "C" | "D";
type Pattern = "HOLDER" | "DRIVER" | "COMPENSATOR" | "OVERRIDER";

const BODY_SITE = "https://body.wearemomentmakers.com";
const VERSION = "event-v1";
const LETTERS: Letter[] = ["A", "B", "C", "D"];
const PATTERN_BY_LETTER: Record<Letter, Pattern> = {
  A: "HOLDER",
  B: "DRIVER",
  C: "COMPENSATOR",
  D: "OVERRIDER",
};
const TIEBREAK_TEXT: Record<Pattern, string> = {
  HOLDER: "My body stays tight and braced after the moment is over.",
  DRIVER: "I have a hard time stopping. I go straight to the next thing.",
  COMPENSATOR: "One part of my body keeps doing more than its share.",
  OVERRIDER: "I notice how my body feels later, not while it's happening.",
};

const QUESTIONS: { id: number; prompt: string; answers: Record<Letter, string> }[] = [
  {
    id: 1,
    prompt: "You're an hour into a long drive.",
    answers: {
      A: "I could not tell you the last time I let go of the wheel with either hand.",
      B: "I've already decided I'm not stopping. Not for food, not for anything.",
      C: "I keep shifting around to get comfortable and I always end up back on the same hip.",
      D: "I don't pay attention to my body until the drive is over, then it's oh, that's sore.",
    },
  },
  {
    id: 2,
    prompt: "It's eight at night and nothing is on the calendar.",
    answers: {
      A: "I sit down to relax and an hour later I'm still perched on the edge of the seat.",
      B: "I'm tired and I find a project anyway. There is always a project.",
      C: "I find the one position on the couch that works and I don't move from it.",
      D: "About twenty minutes in it hits me how wrecked I actually am.",
    },
  },
  {
    id: 3,
    prompt: "You're carrying the groceries in from the car.",
    answers: {
      A: "I set the bags down and my hands stay curled like claws for a second.",
      B: "One trip. Always one trip. Going back out for a second load is losing.",
      C: "Same shoulder, same arm, every single time, and I never decided that.",
      D: "My arm goes dead about an hour later and I blame something else.",
    },
  },
  {
    id: 4,
    prompt: "You've been at the desk for hours and you finally stand up.",
    answers: {
      A: "First thing I do is roll my shoulders and crack my neck before I feel normal again.",
      B: "I stand up, walk around for ninety seconds, and sit right back down.",
      C: "Whatever's stiff when I stand up, it's the same side it always is.",
      D: "Something hurts and I've got no idea what I did to it.",
    },
  },
];

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

// Rotate answer order per question so position never predicts a pattern.
const ORDER: Letter[][] = QUESTIONS.map((_, i) => LETTERS.map((_, j) => LETTERS[(i + 1 + j) % 4]));

function getEventTag(): string | undefined {
  const raw = new URLSearchParams(window.location.search).get("e") ?? "";
  const tag = raw.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  return tag || undefined;
}

function track(event: string, sessionId: string, props: Record<string, unknown> = {}) {
  const body = JSON.stringify({ event, sessionId, resultId: null, props: { version: VERSION, ...props } });
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

type Phase = "questions" | "tiebreak" | "contact";

export default function BodyQuiz() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Letter[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("questions");
  const [tied, setTied] = useState<Pattern[]>([]);
  const [tieBreak, setTieBreak] = useState<Pattern | null>(null);
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const started = useRef(false);
  const contactStarted = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sessionRef = useRef("");
  const sid = () => (sessionRef.current ||= getSessionId());

  useEffect(() => {
    track("landing_page_view", sid());
  }, []);

  function scrollToCard() {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function answer(letter: Letter) {
    if (picked) return;
    if (!started.current) {
      started.current = true;
      track("assessment_started", sid(), { leadId: null });
    }
    track("question_answered", sid(), { question: QUESTIONS[index].id, letter });
    setPicked(letter);
    const next = [...answers.slice(0, index), letter];
    window.setTimeout(() => {
      setPicked(null);
      setAnswers(next);
      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1);
      } else {
        const ties = tiedTopPatterns(next);
        if (ties.length > 0) {
          setTied(ties);
          setPhase("tiebreak");
        } else {
          setPhase("contact");
        }
      }
      scrollToCard();
    }, 260);
  }

  function chooseTie(p: Pattern) {
    if (picked) return;
    setPicked(p);
    window.setTimeout(() => {
      setPicked(null);
      setTieBreak(p);
      setPhase("contact");
      scrollToCard();
    }, 260);
  }

  function back() {
    if (submitting) return;
    if (phase === "contact") {
      setPhase(tied.length > 0 ? "tiebreak" : "questions");
      if (tied.length === 0) setIndex(QUESTIONS.length - 1);
      return;
    }
    if (phase === "tiebreak") {
      setTied([]);
      setPhase("questions");
      setIndex(QUESTIONS.length - 1);
      return;
    }
    if (index > 0) setIndex(index - 1);
  }

  function onFieldFocus() {
    if (!contactStarted.current) {
      contactStarted.current = true;
      track("contact_form_started", sid());
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const next: Record<string, string> = {};
    const name = firstName.trim();
    if (name.length < 1 || name.length > 60) next.firstName = "Enter your first name.";
    if (!isValidPhone(phone)) next.phone = "Please enter a valid phone number.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const leadRes = await fetch("/api/body/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: name, email: email.trim(), phone: phone.trim(), sessionId: sid(), company, version: VERSION }),
      });
      const lead = await leadRes.json().catch(() => ({}));
      if (!leadRes.ok || !lead.id) {
        setFormError(
          lead.suppressed
            ? "Something went wrong saving your details. Please try again, and type your details instead of using autofill."
            : (lead.error ?? "Something went wrong. Please try again."),
        );
        setSubmitting(false);
        return;
      }
      track("contact_form_completed", sid());

      const doneRes = await fetch("/api/body/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          answers,
          sessionId: sid(),
          version: VERSION,
          tieBreakChoice: tieBreak ?? undefined,
          eventTag: getEventTag(),
        }),
      });
      if (!doneRes.ok && doneRes.status !== 409) {
        const done = await doneRes.json().catch(() => ({}));
        setFormError(done.error ?? "Something went wrong scoring your assessment.");
        setSubmitting(false);
        return;
      }
      window.location.assign(`${BODY_SITE}/r/${lead.id}`);
    } catch {
      setFormError("Something went wrong. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  const q = QUESTIONS[index];
  const step = phase === "questions" ? index + 1 : QUESTIONS.length;
  const pct = phase === "contact" ? 100 : Math.round((step / QUESTIONS.length) * 100);

  return (
    <div ref={cardRef} className={styles.card}>
      {phase !== "contact" && (
        <>
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
                {q.answers[letter]}
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

      {phase === "contact" && (
        <form onSubmit={submit} noValidate className={styles.form}>
          <h2 className={styles.prompt}>Your pattern is ready. Where should we send it?</h2>
          <p className={styles.formNote}>It shows up on this screen the second you tap the button, and we text you the full report so you keep it.</p>

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
            Email (optional)
            <input className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} onFocus={onFieldFocus} type="email" inputMode="email" autoComplete="email" />
            {errors.email && <span className={styles.err}>{errors.email}</span>}
          </label>
          <label className={styles.honeypot} aria-hidden="true">
            Leave this field empty
            <input tabIndex={-1} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="off" />
          </label>

          {formError && <p className={styles.err}>{formError}</p>}
          <button type="submit" className={styles.cta} disabled={submitting}>
            {submitting ? "Calculating your pattern…" : "Show Me My Pattern →"}
          </button>
          <p className={styles.legal}>
            By entering your phone number, you agree to receive a text with your results and occasional follow-up about bodywork. Msg &amp; data rates may apply. Reply STOP to opt out.
          </p>
        </form>
      )}

      {(index > 0 || phase !== "questions") && (
        <button type="button" className={styles.back} onClick={back} disabled={submitting}>
          ← Back
        </button>
      )}
    </div>
  );
}
