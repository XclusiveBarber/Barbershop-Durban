import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/privacy-policy", "/terms-of-service"],
        disallow: ["/dashboard", "/api/", "/auth/", "/payment-success", "/payment-cancelled", "/login"],
      },
    ],
    sitemap: "https://xclusivebarber.co.za/sitemap.xml",
  };
}
