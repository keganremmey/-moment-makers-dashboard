import type { Metadata } from "next";
import { Work_Sans, Space_Mono, Fraunces, Anton } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Anton: a single-weight, condensed, ink-heavy poster face — the "fight
// night flyer" register a dojo/gamified brand actually calls for. Used for
// every structural heading and the identity word; deliberately louder than
// a refined editorial serif.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Fraunces: kept only as a quiet accent serif — the forte-mark wordmark and
// quoted client wisdom in the library, where a softer, contemplative italic
// still earns its place against Anton's noise everywhere else.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Moment Makers",
  description: "Private client coaching dashboards.",
  // Defense in depth alongside app/robots.ts — every page here is gated
  // only by an unguessable token in the URL, so nothing should ever be
  // crawled, indexed, or unfurled by a link-preview bot.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${workSans.variable} ${spaceMono.variable} ${fraunces.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        {children}
      </body>
    </html>
  );
}
