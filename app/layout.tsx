import type { Metadata } from "next";
import { Work_Sans, Space_Mono, Fraunces } from "next/font/google";
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

// Fraunces: a heavy, expressive display serif for headlines, contrasted
// against Work Sans's warmer body text and Space Mono's stamped-ledger
// utility type. This is the one deliberate aesthetic risk of the shared
// Moment Makers design system — a bold-self coaching brand shouldn't read
// like a SaaS dashboard. Every client shares this same type/palette/
// component system; only a per-client identity word and accent color
// (see app/d/[token]) vary.
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
      className={`${workSans.variable} ${spaceMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        {children}
      </body>
    </html>
  );
}
