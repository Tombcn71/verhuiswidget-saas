import type { Metadata } from "next";
import { headers } from "next/headers";
import { Widget } from "@/app/widget/[companyId]/widget";
import { DEMO_COMPANY_PUBLIC } from "@/lib/demo";
import { isAdminViewer } from "@/lib/admin";
import { getProspectBySlug } from "@/lib/prospects";
import { handleDemoOpened } from "@/lib/prospect-mails";

export const dynamic = "force-dynamic";

// Linkvoorbeelden (WhatsApp, Facebook, Slack…) en crawlers halen de pagina ook op;
// dat is niet de verhuizer zelf, dus niet als "geopend" tellen.
const PREVIEW_BOT = /whatsapp|facebookexternalhit|facebot|telegrambot|slackbot|twitterbot|linkedinbot|discordbot|skypeuripreview|bot\b|crawler|spider|preview/i;

export async function generateMetadata({ params }: PageProps<"/demo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  return {
    title: { absolute: p ? `moverAI-demo voor ${p.companyName}` : "Probeer moverAI in 1 minuut" },
    description: "Maak foto's van een kamer en zie hoe de AI de meubels herkent en direct een offerte maakt.",
    robots: { index: false },
  };
}

/**
 * Persoonlijke demolink voor een verhuisbedrijf uit de verkoop-CRM. Gegevens staan
 * al ingevuld; openen/afronden/boeken wordt bijgehouden (niet als je zelf beheerder bent).
 */
export default async function ProspectDemoPage({ params }: PageProps<"/demo/[slug]">) {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  const ua = (await headers()).get("user-agent") ?? "";
  if (p && !PREVIEW_BOT.test(ua) && !(await isAdminViewer())) await handleDemoOpened(p.slug);

  return (
    <div className="mx-auto w-full max-w-md bg-white sm:shadow-xl sm:ring-1 sm:ring-slate-200">
      <Widget
        company={DEMO_COMPANY_PUBLIC}
        demo
        prospect={p?.slug}
        calendlyUrl={process.env.CALENDLY_URL ?? null}
        demoContact={
          p ? { name: p.contactName || p.companyName, email: p.email, phone: p.phone } : undefined
        }
      />
    </div>
  );
}
