import type { Metadata } from "next";
import Link from "next/link";
import { requireCompany } from "@/lib/current-company";
import { CopyBlock } from "./copy-block";

export const metadata: Metadata = { title: "Widget-code" };

export default async function EmbedPage() {
  const company = await requireCompany();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const embedCode = `<script src="${appUrl}/embed.js" data-company-id="${company.id}" async></script>`;
  const directLink = `${appUrl}/widget/${company.id}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Widget-code</h1>
        <p className="mt-1 text-sm text-slate-600">
          Plak deze code op je eigen website waar je de widget wilt tonen. De widget haalt
          automatisch jouw tarieven en huisstijl op.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">1. Embed-code</h2>
        <p className="text-sm text-slate-600">
          Plaats dit script in de HTML van je pagina. De widget verschijnt op de plek van het
          script.
        </p>
        <CopyBlock code={embedCode} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">2. Of een directe link</h2>
        <p className="text-sm text-slate-600">
          Handig om te testen of te delen, bijvoorbeeld via e-mail of social media.
        </p>
        <CopyBlock code={directLink} />
        <Link
          href={`/widget/${company.id}`}
          target="_blank"
          className="inline-block text-sm font-medium text-brand-600 underline"
        >
          Widget openen in nieuw tabblad →
        </Link>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Let op:</strong> deel je <code>company-id</code> gerust — hiermee zijn alleen je
        publieke tarieven en huisstijl zichtbaar, geen klant- of bedrijfsgegevens.
      </section>
    </div>
  );
}
