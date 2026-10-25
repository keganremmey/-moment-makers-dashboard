// Shared constants for the apartment-flyer landing page (/intro).

// The existing GoHighLevel calendar for the free 20-minute session, the same
// one embedded under "BOOKING · FREE 20-MINUTE STRUCTURAL RESET" on
// wearemomentmakers.com/touchthatworks. Its booking page is titled
// "Free 20-Minute Structural Bodywork Reset".
export const FREE_20_BOOKING_URL =
  "https://book.wearemomentmakers.com/widget/booking/8GqdiM5N0ad9d59SFwGp";

// Vercel's production address for this project. app.wearemomentmakers.com
// has no DNS record yet; this address keeps working after it does, so QR
// codes printed against it never break.
export const SITE_ORIGIN = "https://moment-makers-dashboard.vercel.app";
export const INTRO_PATH = "/intro";
export const INSTAGRAM_URL = "https://www.instagram.com/touchthatworks/";

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

// Defaults printed on the apartment flyer QR codes. utm_content carries the
// property, one value per building.
export const FLYER_UTM = {
  utm_source: "apartment_flyer",
  utm_medium: "print",
  utm_campaign: "bodywork_intro",
} as const;

// Keeps whatever reaches the database short and plain.
export function cleanParam(value: unknown, max = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
}

export function utmFromParams(params: URLSearchParams): Utm {
  const utm: Utm = {};
  for (const key of UTM_KEYS) {
    const value = cleanParam(params.get(key));
    if (value) utm[key] = value;
  }
  return utm;
}

export function propertySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export function flyerUrl(property: string): string {
  const params = new URLSearchParams({ ...FLYER_UTM, utm_content: propertySlug(property) });
  return `${SITE_ORIGIN}${INTRO_PATH}?${params.toString()}`;
}

// Client testimonial videos on the Moment Makers YouTube channel, the same
// set embedded on the Touch That Works page plus the leg-work video. Labels
// are the quoted part of each video's own title.
export const TESTIMONIAL_VIDEOS = [
  { id: "2SLry39PxFk", label: "My neck pain is gone" },
  { id: "GX7Y3oiXi-g", label: "80% of my back pain gone in one session" },
  { id: "rPCNE2VmCh4", label: "My legs finally feel free" },
  { id: "5oTxhvyenPs", label: "Yoga wasn't enough. This fixed what stretching couldn't." },
  { id: "Sd4N2XBPHwc", label: "He can fix your body" },
  { id: "lj3Y0DPzMHk", label: "This is exactly what I needed" },
  { id: "BxJNcRAk70g", label: "Real people. Real results." },
] as const;
