import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Alles openbaar, ook voor AI-zoekdiensten; alleen het besloten deel en de klantpagina's niet. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/dashboard",
        "/organisatie",
        "/widget",
        "/offerte",
        "/boeken",
        "/gesprek",
        "/reel",
        "/inloggen",
        "/registreren",
        "/kies-plan",
        "/account-verwijderd",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
