import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// IBM Plex Sans + JetBrains Mono , the dashboard pairing for this project
// (as distinct from a marketing-site pairing): one workhorse grotesque
// across body, headings, and the accent/quote role, plus a metrics mono for
// data. Replaces an earlier four-font system (Work Sans/Space Mono/Anton/
// Fraunces) that read more like a marketing poster than a client tool.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Moment Makers",
  description: "Private client coaching dashboards.",
  // Defense in depth alongside app/robots.ts , every page here is gated
  // only by an unguessable token in the URL, so nothing should ever be
  // crawled, indexed, or unfurled by a link-preview bot.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink text-ink">
        {children}
      </body>
    </html>
  );
}
