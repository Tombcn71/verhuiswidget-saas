import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import heroImage from "@/public/blog-ai-verhuisbedrijf.jpg";
import { SiteHeader } from "@/app/_components/site-header";
import { SiteFooter } from "@/app/_components/site-footer";
import { WhatsAppButton } from "@/app/_components/whatsapp-button";

export const metadata: Metadata = {
  title: "Blog",
  description: "Artikelen over AI, offertes en voorinspecties voor verhuisbedrijven.",
};

const POSTS = [
  {
    href: "/blog/ai-verhuisbedrijf-invoeren",
    title: "Hoe voer je AI in je verhuisbedrijf in? Zo begin je in 3 stappen",
    intro: "AI invoeren hoeft geen maanden te duren. Zonder implementatiekosten, in 14 dagen gratis proeftijd.",
    date: "5 november 2026",
    image: heroImage,
  },
  {
    href: "/blog/voordelen-ai-verhuisbedrijf",
    title: "Wat zijn de voordelen van AI voor een verhuisbedrijf? 6 voordelen op een rij",
    intro: "Sneller offertes op offerteplatforms, minder voorinspecties, minder brandstof en meer Google-reviews.",
    date: "5 november 2026",
    image: null,
  },
];

/** Overzicht van de blogartikelen. Nieuw artikel: eigen map onder app/blog en een regel in POSTS. */
export default function BlogPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto w-full max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Blog</h1>
          <div className="mt-10 space-y-8">
            {POSTS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="block overflow-hidden rounded-2xl border border-border transition hover:shadow-lg"
              >
                {p.image && (
                  <div className="relative aspect-6/5 w-full">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    placeholder="blur"
                    sizes="(min-width: 768px) 48rem, 100vw"
                    className="object-cover object-center"
                  />
                </div>
                )}
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">{p.date}</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">{p.title}</h2>
                  <p className="mt-2 text-lg text-muted-foreground">{p.intro}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
