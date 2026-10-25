import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import heroPhoto from "@/public/intro/remmey-working.jpg";
import collage from "@/public/intro/client-collage.jpg";
import { INSTAGRAM_URL, SITE_ORIGIN, TESTIMONIAL_VIDEOS } from "@/lib/intro";
import { BookLink, StickyBook, VisitBeacon } from "./_components/tracking";
import VideoFacade from "./_components/VideoFacade";

// Landing page for the apartment mailroom flyer. Residents arrive by QR code
// with utm_* params naming the property; every booking button goes through
// /intro/book to the existing free 20-minute GoHighLevel calendar.
//
// Every fact here comes from wearemomentmakers.com/touchthatworks or the
// free-20 calendar's own description. Client quotes are verbatim.

const TITLE = "Free 20-minute bodywork session in Austin · Touch That Works";
const DESCRIPTION =
  "You point to the spot that hurts. Remmey works it for 20 minutes, free, at his private studio in Rollingwood. Then you decide whether to book a full session.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/intro" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/intro",
    siteName: "Touch That Works · Kegan Remmey",
    title: "My shoulders HURT. Get 20 free minutes on the spot.",
    description: DESCRIPTION,
    images: [
      {
        url: "/og/touchthatworks.jpg",
        width: 1080,
        height: 1080,
        alt: "Kegan Remmey working with bodywork clients in Austin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "My shoulders HURT. Get 20 free minutes on the spot.",
    description: DESCRIPTION,
    images: ["/og/touchthatworks.jpg"],
  },
};

const BUTTON =
  "inline-flex min-h-14 items-center justify-center rounded-md bg-ttw-copper px-6 py-4 text-center text-lg font-semibold leading-tight text-ttw-cream shadow-sm transition-colors hover:bg-ttw-copper-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ttw-charcoal motion-reduce:transition-none";
const LABEL = "font-ttw-mono text-xs uppercase tracking-[0.14em] text-ttw-copper";
const H2 = "font-ttw-serif text-3xl leading-tight font-semibold text-balance md:text-5xl";

const STEPS = [
  {
    title: "Pick a time",
    body: "Choose an open slot on Remmey's calendar. It's free for first-time clients, and no card is required.",
  },
  {
    title: "Point to the spot",
    body: "Meet Remmey at his studio and show him what's been loudest. The shoulder, the low back, the knot that's been there for years.",
  },
  {
    title: "20 minutes of hands-on work",
    body: "Hands on from the first minute. He stays on that one area and follows it to whatever is holding it there. Firm pressure, always within your tolerance.",
  },
  {
    title: "Decide afterward",
    body: "If you want more, a full session is 75 minutes and $200. If not, you walk. There's no pitch on the way out.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "You just got rid of a painful knot in my leg in ten minutes that's been there for over ten years.",
    name: "Vince C.",
    role: "Investor",
  },
  {
    quote:
      "I can finally turn my head left and right without pain and sleep on my right side again. Thank you so much.",
    name: "Jonathan R.",
    role: "Engineer",
  },
  {
    quote:
      "This is the best bodywork I've had ever, and I've seen people all over the world. As a woman, you made me feel completely safe to cry and be held, plus your wizard hands move my pelvis so I can run again.",
    name: "Priyanka S.",
    role: null,
  },
];

const AFTER_BOOKING = [
  "The calendar confirms your time and sends you the details.",
  "The exact address comes by text once your appointment is booked. Private studio in Rollingwood, free parking on site.",
  "Wear athletic shorts, plus a sports bra or fitted tank if that suits you.",
  "Super tight muscles? Sauna before your session. Text him 45 minutes ahead so he can get it hot, bring a towel, and arrive 15 minutes early to feel the heat.",
  "Need to move it? Reschedule from your confirmation email with 24 hours' notice. Inside 24 hours, text him.",
];

export default function IntroPage() {
  return (
    <>
      <VisitBeacon />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-ttw-charcoal focus:px-4 focus:py-2 focus:text-ttw-cream"
      >
        Skip to content
      </a>

      <header className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-4 pt-5 md:px-8">
        <p className="font-ttw-serif text-lg font-semibold tracking-tight whitespace-nowrap md:text-xl">Touch That Works</p>
        <p className="font-ttw-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap text-ttw-muted">
          <span className="hidden sm:inline">Structural bodywork · </span>Rollingwood, TX
        </p>
      </header>

      <main id="main">
        {/* A: Hero */}
        <section
          aria-labelledby="hero-heading"
          className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 pb-16 md:grid-cols-[1.15fr_0.85fr] md:items-center md:gap-14 md:px-8 md:pt-16 md:pb-24"
        >
          <div>
            <h1
              id="hero-heading"
              className="font-ttw-serif text-[2.75rem] leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl"
            >
              My shoulders fucking{" "}
              <strong className="font-bold text-ttw-copper not-italic">HURT.</strong>
            </h1>
            <blockquote className="mt-6 border-l-4 border-ttw-copper pl-4 font-ttw-serif text-xl leading-snug italic md:text-2xl">
              &ldquo;I don&apos;t want to waste another dollar on someone who just touches me
              lightly.&rdquo;
            </blockquote>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ttw-muted">
              You tell them exactly where it hurts. They work on it for a few minutes. You leave
              wishing they&apos;d spent the whole session on that one spot.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:items-start">
              <BookLink id="hero-cta" cta="hero" className={BUTTON}>
                Book Your Free 20-Minute Hands-On Session
              </BookLink>
              <p className="text-base text-ttw-muted">
                Experience Remmey&apos;s work before deciding whether to book a full session.
              </p>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-ttw-mono text-xs uppercase tracking-[0.12em] text-ttw-charcoal">
              <li>Free for first-timers</li>
              <li aria-hidden="true" className="text-ttw-copper">/</li>
              <li>No card required</li>
              <li aria-hidden="true" className="text-ttw-copper">/</li>
              <li>Rollingwood, TX</li>
            </ul>
          </div>

          <div className="relative">
            <Image
              src={heroPhoto}
              alt="Remmey working on a client's shoulder and arm on the table in his studio"
              preload
              placeholder="blur"
              sizes="(min-width: 768px) 40vw, 100vw"
              className="aspect-[4/5] w-full rounded-md object-cover object-[50%_35%] shadow-sm"
            />
          </div>
        </section>

        {/* B: The experience */}
        <section aria-labelledby="experience-heading" className="border-y border-ttw-line bg-ttw-cream-2">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
            <p className={LABEL}>Your free 20 minutes</p>
            <h2 id="experience-heading" className={`${H2} mt-3 max-w-3xl`}>
              Here&apos;s exactly what happens.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ttw-muted">
              Remmey is Kegan Remmey, a structural bodyworker working out of a private studio in
              Rollingwood. The free 20 minutes is how he lets new people feel his work before
              they spend anything.
            </p>

            <ol className="mt-10 grid gap-5 md:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-md border border-ttw-line bg-ttw-cream p-5">
                  <h3 className="flex items-baseline gap-3 text-lg font-semibold md:flex-col md:gap-1">
                    <span className="font-ttw-serif text-3xl font-semibold text-ttw-copper md:text-4xl" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      <span className="sr-only">Step {i + 1}: </span>
                      {step.title}
                    </span>
                  </h3>
                  <p className="mt-2 leading-relaxed text-ttw-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* C: Client results */}
        <section aria-labelledby="results-heading" className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <p className={LABEL}>Actual client results</p>
          <h2 id="results-heading" className={`${H2} mt-3 max-w-4xl`}>
            Hundreds of people in Austin have found lasting relief working with Remmey.
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="flex flex-col justify-between rounded-md border border-ttw-line bg-white/50 p-6">
                <blockquote className="font-ttw-serif text-2xl leading-snug">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 font-ttw-mono text-xs uppercase tracking-[0.12em] text-ttw-muted">
                  <span className="text-ttw-charcoal">{t.name}</span>
                  {t.role ? `, ${t.role}` : null}
                </figcaption>
              </figure>
            ))}
          </div>

          <h3 className="mt-16 font-ttw-serif text-2xl font-semibold md:text-3xl">
            More clients, on camera.
          </h3>
          <p className="mt-2 text-ttw-muted">Tap to play. Swipe for more.</p>
          <div className="-mx-4 mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {TESTIMONIAL_VIDEOS.map((v) => (
              <div key={v.id} className="w-[80%] shrink-0 snap-start md:w-auto">
                <VideoFacade id={v.id} label={v.label} />
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-md border border-ttw-line p-6 md:flex md:items-center md:justify-between md:gap-6">
            <p className="font-ttw-serif text-2xl leading-snug">
              Don&apos;t take my word for it. Ask my clients.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex min-h-12 items-center rounded-md border-2 border-ttw-charcoal px-5 font-semibold hover:bg-ttw-charcoal hover:text-ttw-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ttw-copper md:mt-0"
            >
              @touchthatworks on Instagram
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </section>

        {/* D: The practitioner */}
        <section aria-labelledby="remmey-heading" className="bg-ttw-charcoal text-ttw-cream">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:gap-14 md:px-8 md:py-24">
            <div>
              <p className="font-ttw-mono text-xs uppercase tracking-[0.14em] text-ttw-copper-light">
                Who you&apos;ll be working with
              </p>
              <h2 id="remmey-heading" className={`${H2} mt-3`}>
                Meet Remmey.
              </h2>
              <blockquote className="mt-6 border-l-4 border-ttw-copper-light pl-4 font-ttw-serif text-xl leading-snug italic">
                &ldquo;By 2014 I was rubbing my own shoulder every single day without noticing I
                was doing it. I told myself it was just tight.&rdquo;
              </blockquote>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-ttw-cream/85">
                <p>
                  That shoulder is how he started. He has been a certified hypnotherapist since
                  2014 and a structural bodyworker since 2021, and has worked with hundreds of
                  clients one-on-one and in groups.
                </p>
                <p>
                  The work is structural and fascial: hips, shoulders, ribs, spine, legs, feet.
                  You point to the spot. He stays on it, and follows it to whatever is holding it
                  there.
                </p>
              </div>
              <figure className="mt-8 rounded-md bg-ttw-cream/5 p-5">
                <blockquote className="font-ttw-serif text-xl leading-snug">
                  &ldquo;Every other bodyworker moved on too fast. He held it until it actually let
                  go.&rdquo;
                </blockquote>
                <figcaption className="mt-3 font-ttw-mono text-xs uppercase tracking-[0.12em] text-ttw-cream/60">
                  Richie V., Gymnast
                </figcaption>
              </figure>
            </div>
            <Image
              src={collage}
              alt="Collage of Remmey in his studio with clients: working on a shoulder, a hip and an ankle, high-fives, and a client doing a handstand"
              placeholder="blur"
              sizes="(min-width: 768px) 45vw, 100vw"
              className="w-full rounded-md"
            />
          </div>
        </section>

        {/* E: Final booking */}
        <section id="book" aria-labelledby="book-heading" className="mx-auto max-w-3xl px-4 py-16 text-center md:px-8 md:py-24">
          <p className={LABEL}>Free for first-time clients</p>
          <h2 id="book-heading" className={`${H2} mt-3`}>
            Feel the difference for yourself.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ttw-muted">
            The free 20 minutes is a standing offer on Remmey&apos;s calendar for anyone who
            hasn&apos;t worked with him yet. Pick the loudest thing in your body. You&apos;ll know in
            20 minutes whether he found it.
          </p>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ttw-muted">
            <strong className="text-ttw-charcoal">Real talk.</strong> Leave the spa expectations
            at home. He holds steady, firm pressure while you move, and you say how much the whole
            time.
          </p>

          <div id="final-cta" className="mt-8 flex flex-col items-center gap-3">
            <BookLink cta="final" className={BUTTON}>
              Book Your Free 20-Minute Session
            </BookLink>
            <p className="text-sm text-ttw-muted">No card required. Rollingwood, TX.</p>
          </div>

          <div className="mx-auto mt-12 max-w-xl text-left">
            <h3 className="font-ttw-serif text-2xl font-semibold">After you book</h3>
            <ul className="mt-4 space-y-3">
              {AFTER_BOOKING.map((line) => (
                <li key={line} className="flex gap-3 leading-relaxed">
                  <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-ttw-copper" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-ttw-line pb-28 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ttw-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>Touch That Works · Kegan Remmey · Rollingwood, TX</p>
          <nav aria-label="Footer" className="flex gap-5">
            <Link href="/intro/privacy" className="underline underline-offset-4 hover:text-ttw-charcoal">
              Privacy
            </Link>
            <a
              href="https://wearemomentmakers.com/touchthatworks"
              className="underline underline-offset-4 hover:text-ttw-charcoal"
            >
              Full site
            </a>
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ttw-muted md:px-8">
          Structural bodywork, not massage therapy or medical treatment. Remmey is not a licensed
          medical professional, and this work does not replace medical care.
        </p>
      </footer>

      <StickyBook heroId="hero-cta" finalId="final-cta" />
    </>
  );
}
