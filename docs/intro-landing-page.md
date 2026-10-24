# /intro: apartment-flyer landing page

Live path: `app.wearemomentmakers.com/intro` (once this branch is merged to main).

## What's where

| Path | What it does |
| --- | --- |
| `/intro` | The landing page. Static, no data fetching. |
| `/intro/book` | Every booking button lands here. Logs `booking_redirect`, then 302s to the free 20-minute GoHighLevel calendar with the flyer's utm tags attached. |
| `/api/intro/track` | Beacon for `visit` and `cta_click`. |
| `/intro/links/<ADMIN_ACCESS_TOKEN>` | Private. Builds a tracked URL + QR (PNG and SVG) per property, and shows visits / taps / sent-to-calendar per property for the last 90 days. |
| `/intro/privacy` | Privacy notice for the page. |
| `lib/intro.ts` | Booking URL, Instagram URL, flyer UTM defaults, video list. |

Booking calendar: `https://book.wearemomentmakers.com/widget/booking/8GqdiM5N0ad9d59SFwGp`
("Free 20-Minute Structural Bodywork Reset", the same calendar embedded on the Touch That Works page).
It's linked, not embedded: the GoHighLevel widget took about 9 seconds to load on a simulated phone.

## QR code URLs

```
https://app.wearemomentmakers.com/intro?utm_source=apartment_flyer&utm_medium=print&utm_campaign=bodywork_intro&utm_content=<property>
```

Use `/intro/links/<token>` to make them: type the property name, download the SVG for print.

## The funnel and where each step is counted

1. Visits: `intro_events` (Supabase), `event = 'visit'`.
2. Booking button taps: `intro_events`, `event = 'cta_click'` (`cta` = hero / sticky / final).
3. Sent into the calendar: `intro_events`, `event = 'booking_redirect'`. This is a redirect, not a booking.
4. Confirmed bookings: GoHighLevel. Appointments on the free-20 calendar whose contact has
   `attributionSource.utmContent` = the property.
5. Attended: GoHighLevel, same appointments marked Showed.
6. Paid: GoHighLevel, those contacts with a later 75-minute booking or payment.

`intro_events` stores no IP, user agent, cookies, names or contact details. `visit_id` is a random id in the
tab's sessionStorage.

## Environment

Needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (event logging; the page still works without them) and
`ADMIN_ACCESS_TOKEN` (links page). Migration: `supabase/migrations/0004_intro_events.sql` (already applied to
the main Supabase project).
