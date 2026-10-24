import { Fraunces, IBM_Plex_Mono } from "next/font/google";

// Fonts for the apartment-flyer landing page, matching the Touch That Works
// site: Fraunces for headlines and quotes, IBM Plex Sans (already loaded by
// the root layout) for body, IBM Plex Mono for small labels.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export default function IntroLayout({ children }: LayoutProps<"/intro">) {
  return (
    <div className={`${fraunces.variable} ${plexMono.variable} min-h-full flex-1 bg-ttw-cream font-sans text-ttw-charcoal`}>
      {children}
    </div>
  );
}
