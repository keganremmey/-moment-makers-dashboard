import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fraunces: a heavy, expressive display serif for headlines, contrasted
// against Geist's quiet sans/mono for data. This is the one deliberate
// aesthetic risk of the shared Moment Makers design system — a bold-self
// coaching brand shouldn't read like a SaaS dashboard. Every client shares
// this same type/palette/component system; only a per-client identity word
// and accent color (see app/d/[token]) vary.
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-paper">
        {children}
      </body>
    </html>
  );
}
