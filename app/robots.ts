import type { MetadataRoute } from "next";

// Every page here is a private, unauthenticated-by-design link (the token
// in the URL is the entire access control). There's nothing on this site
// that should ever be crawled or indexed. The exceptions are the public
// share link and its preview image, so link-preview fetchers can read them,
// and the public /intro landing page (minus its token-gated /intro/links).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/touchthatworks", "/og/", "/intro"],
      disallow: ["/", "/intro/links"],
    },
  };
}
