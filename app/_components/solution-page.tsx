import type { LucideIcon } from "lucide-react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { WhatsAppButton } from "./whatsapp-button";
import { PlanDemoButton } from "./plan-demo-button";

export type SolutionContent = {
  /** Bijv. "Onlink" en "Via een linkje". */
  name: string;
  sub: string;
  Icon: LucideIcon;
  title: React.ReactNode;
  intro: string;
  /** Afbeelding of voorbeeld naast de kop. */
  visual: React.ReactNode;
  steps: { title: string; text: string }[];
  benefits: { Icon: LucideIcon; title: string; text: string }[];
  /** Extra blok na de stappen, bijv. de animatie van Snelle acties. */
  extra?: React.ReactNode;
  faqs: { q: string; a: string }[];
};

/**
 * Landingspagina voor één manier van gebruik (Onlink, Onsite, Onspot). Alles
 * stuurt naar één doel: een demogesprek van 5 minuten.
 */
export function SolutionPage({ c }: { c: SolutionContent }) {
  const calendlyUrl = process.env.CALENDLY_URL ?? null;
  const from = c.name.toLowerCase();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Kop */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-16 pb-20 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
              <c.Icon className="size-3.5" />
              {c.name} · {c.sub}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{c.title}</h1>
            <p className="mt-6 text-lg text-muted-foreground">{c.intro}</p>
            <div className="mt-8">
              <PlanDemoButton href={calendlyUrl} from={`${from} kop`} className="w-full sm:w-auto" />
              <p className="mt-3 text-sm text-muted-foreground">5 minuten · vrijblijvend</p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md lg:max-w-none">{c.visual}</div>
        </section>

        {/* Zo werkt het */}
        <section className="border-t border-border bg-muted py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Zo werkt het</h2>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {c.steps.map((s, i) => (
                <li key={s.title} className="rounded-xl border border-border bg-background p-6 shadow-sm">
                  <span className="flex size-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {c.extra}

        {/* Wat het je oplevert */}
        <section className="py-20">
          <div className="mx-auto w-full max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Wat het je oplevert</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {c.benefits.map((b) => (
                <div key={b.title} className="flex gap-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <b.Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{b.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vragen */}
        <section className="border-t border-border py-20">
          <div className="mx-auto w-full max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight">Veelgestelde vragen</h2>
            <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-background">
              {c.faqs.map((f) => (
                <details key={f.q} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-xl leading-none text-brand-600 transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-foreground/85">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Afsluiter */}
        <section className="bg-brand-600 py-16">
          <div className="mx-auto w-full max-w-3xl px-6 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Zien hoe het voor jou werkt?</h2>
            <p className="mt-3">
              In 5 minuten laat ik zien hoe je klant binnen een minuut jouw offerte krijgt, met jouw
              tarieven.
            </p>
            <PlanDemoButton
              href={calendlyUrl}
              from={`${from} onderaan`}
              className="mt-6 bg-background text-brand-700 hover:bg-muted"
            />
          </div>
        </section>
      </main>
      <SiteFooter />
      <WhatsAppButton />
    </div>
  );
}
