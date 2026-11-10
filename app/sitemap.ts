import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const PAGES: { path: string; priority: number; lastModified?: string }[] = [
  { path: "", priority: 1 },
  { path: "/onlink", priority: 0.9 },
  { path: "/onsite", priority: 0.9 },
  { path: "/onspot", priority: 0.9 },
  { path: "/pakketten", priority: 0.8 },
  { path: "/rekenhulp", priority: 0.7 },
  { path: "/demo", priority: 0.7 },
  { path: "/blog", priority: 0.7 },
  { path: "/blog/ai-verhuisbedrijf-invoeren", priority: 0.8, lastModified: "2026-11-05" },
  { path: "/blog/voordelen-ai-verhuisbedrijf", priority: 0.8, lastModified: "2026-11-05" },
];

/** Openbare pagina's. Nieuw blogartikel: voeg hier ook een regel toe. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    priority: p.priority,
    ...(p.lastModified ? { lastModified: p.lastModified } : {}),
  }));
}
