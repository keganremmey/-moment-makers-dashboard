import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy · Touch That Works",
  description: "What the Touch That Works free-session page records, and what it doesn't.",
  robots: { index: true, follow: true },
};

export default function IntroPrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed md:py-16">
      <Link href="/intro" className="font-ttw-mono text-xs uppercase tracking-[0.14em] text-ttw-copper underline underline-offset-4">
        Back to the free session
      </Link>
      <h1 className="mt-6 font-ttw-serif text-4xl font-semibold">Privacy</h1>

      <div className="mt-6 space-y-5 text-ttw-muted">
        <p>
          This page belongs to Touch That Works, Kegan Remmey&apos;s structural bodywork practice
          in Rollingwood, TX.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-ttw-charcoal">What this page records</h2>
        <p>
          When you open this page, tap a booking button, or get sent to the booking calendar, we
          record that it happened, the time, and the campaign tags in the link you used (for
          example, which apartment community&apos;s flyer you scanned). That tells us which flyers
          are worth printing again.
        </p>
        <p>
          We do not record your name, contact details, IP address or device details on this
          page, and we do not set cookies. A random visit number is kept in your browser tab only
          until you close it, so a button tap can be matched to its page visit.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-ttw-charcoal">When you book</h2>
        <p>
          Booking happens on our calendar at book.wearemomentmakers.com, run on GoHighLevel. The
          details you enter there (name, phone, email) are used to confirm, remind you about and
          manage your appointment. The flyer&apos;s campaign tags are passed along with you so we
          can see which flyer a booking came from.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-ttw-charcoal">Videos and map</h2>
        <p>
          Client videos load from YouTube in privacy-enhanced mode, and only after you tap play.
          The map near the bottom of the page loads from Google Maps when you scroll to it.
        </p>

        <h2 className="pt-2 text-lg font-semibold text-ttw-charcoal">Questions</h2>
        <p>
          Ask Remmey at your session, or reply to your booking confirmation, and he&apos;ll tell
          you what we hold and delete it on request.
        </p>
      </div>
    </main>
  );
}
