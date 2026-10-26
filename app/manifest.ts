import type { MetadataRoute } from "next";

/** Maakt moverAI installeerbaar op het startscherm; opent direct in het dashboard. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "moverAI",
    short_name: "moverAI",
    description: "AI-offertes voor verhuizers: scannen, aanvragen en offertes.",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a73e8",
    lang: "nl",
    icons: [
      { src: "/app-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Scannen", url: "/dashboard/scan" },
      { name: "Aanvragen", url: "/dashboard/leads" },
    ],
  };
}
