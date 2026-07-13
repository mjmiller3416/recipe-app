import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // App routes are auth-gated anyway; keep crawlers out of them
        disallow: [
          "/dashboard",
          "/recipes",
          "/meal-planner",
          "/shopping-list",
          "/settings",
          "/admin",
          "/sso-callback",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
