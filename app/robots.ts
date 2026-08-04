import type { MetadataRoute } from "next";

// Every page here is a private, unauthenticated-by-design link (the token
// in the URL is the entire access control). There's nothing on this site
// that should ever be crawled or indexed.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
