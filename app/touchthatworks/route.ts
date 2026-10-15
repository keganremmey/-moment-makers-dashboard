// Share link for the Touch That Works page: app.wearemomentmakers.com/touchthatworks
//
// The real page lives on GoHighLevel (wearemomentmakers.com/touchthatworks),
// which has no preview image or title set. Link-preview bots (iMessage,
// WhatsApp, Facebook, Slack, LinkedIn, X) get a tiny page carrying the
// collage and the hero line; people tapping the link go straight to the
// GoHighLevel page with a redirect.
const TARGET = "https://wearemomentmakers.com/touchthatworks";
const SELF = "https://app.wearemomentmakers.com/touchthatworks";
const IMAGE = "https://app.wearemomentmakers.com/og/touchthatworks.jpg";
const TITLE = "Find what's actually causing it. Move like you used to.";
const DESCRIPTION = "Structural bodywork with Kegan Remmey in Austin. Book a free 20-minute tune-up.";

// iMessage previews identify as facebookexternalhit/Facebot/Twitterbot.
const PREVIEW_BOTS =
  /facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|slack-imgproxy|linkedinbot|telegrambot|discordbot|skypeuripreview|pinterest|redditbot|applebot|googlebot|bingbot|embedly|iframely|vkshare|snapchat|signal|zoominfobot|bot\b|crawler|spider|preview/i;

export function GET(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const query = new URL(request.url).search;

  if (!PREVIEW_BOTS.test(ua)) {
    return Response.redirect(TARGET + query, 307);
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${TITLE}</title>
<meta name="description" content="${DESCRIPTION}">
<link rel="canonical" href="${TARGET}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Touch That Works · Kegan Remmey">
<meta property="og:url" content="${SELF}">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESCRIPTION}">
<meta property="og:image" content="${IMAGE}">
<meta property="og:image:secure_url" content="${IMAGE}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1080">
<meta property="og:image:height" content="1080">
<meta property="og:image:alt" content="Kegan Remmey working with bodywork clients in Austin">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${DESCRIPTION}">
<meta name="twitter:image" content="${IMAGE}">
<meta http-equiv="refresh" content="0; url=${TARGET}">
</head>
<body><a href="${TARGET}">${TITLE}</a></body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
