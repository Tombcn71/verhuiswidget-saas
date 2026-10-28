import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompanyById } from "@/lib/companies";
import { isDemoCompany } from "@/lib/demo";
import { createLead } from "@/lib/leads";
import { mailer, sender } from "@/lib/mailer";
import { isValidPhone } from "@/lib/phone";
import { hasAccess } from "@/lib/plans";
import { appUrl } from "@/lib/app-url";
import { CORS, futureDate, jsonResponse as json } from "@/lib/widget-request";

export const runtime = "nodejs";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const payloadSchema = z.object({
  companyId: z.uuid(),
  source: z.enum(["onsite", "onlink", "onspot"]).default("onsite"),
  moveType: z.enum(["verhuizing", "ontruiming"]).default("verhuizing"),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email(),
    phone: z
      .string()
      .trim()
      .max(40)
      .refine((p) => isValidPhone(p), "Vul een geldig telefoonnummer in."),
  }),
  fromAddress: z.string().trim().max(200).optional().or(z.literal("")),
  moveDate: futureDate,
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"));

/**
 * Aanvraag zonder scan: de widget toont dit formulier als de scans van de
 * verhuizer op zijn. Geen AI en geen prijs; de verhuizer krijgt de lead en belt terug.
 */
export async function POST(request: Request) {
  let parsed;
  try {
    parsed = payloadSchema.parse(await request.json());
  } catch (err) {
    const message =
      err instanceof z.ZodError ? err.issues.map((i) => i.message).join(", ") : "Ongeldige aanvraag.";
    return json({ error: message }, 400);
  }
  if (isDemoCompany(parsed.companyId)) return json({ error: "Niet beschikbaar in de demo." }, 400);
  const company = await getCompanyById(parsed.companyId);
  if (!company) return json({ error: "Onbekende verhuizer." }, 404);

  const lead = await createLead({
    companyId: company.id,
    source: parsed.source,
    customerName: parsed.customer.name,
    customerEmail: parsed.customer.email,
    customerPhone: parsed.customer.phone || null,
    moveType: parsed.moveType,
    fromAddress: parsed.fromAddress || null,
    moveDate: parsed.moveDate || null,
    notes: [
      "Aanvraag zonder scan: je scans van deze maand waren op. Bel de klant terug voor een prijs.",
      parsed.message ? `Bericht van de klant: ${parsed.message}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  // Proef verlopen zonder betaling: de lead staat er, maar is pas na activeren te zien.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.QUOTE_FROM_EMAIL;
  if (apiKey && from && hasAccess(company)) {
    const c = parsed.customer;
    const rows: [string, string][] = [
      ["Naam", c.name],
      ["E-mail", c.email],
      ["Telefoon", c.phone],
      ["Soort", parsed.moveType === "ontruiming" ? "Ontruiming" : "Verhuizing"],
      ["Adres", parsed.fromAddress || "—"],
      ["Datum", parsed.moveDate || "—"],
      ["Bericht", parsed.message || "—"],
    ];
    await mailer(apiKey)
      .emails.send({
        from: sender("moverAI", "aanvragen") ?? `moverAI <${from}>`,
        to: company.email,
        replyTo: c.email,
        subject: `Nieuwe aanvraag van ${c.name} (zonder prijs)`,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0f172a;max-width:560px">
          <p><strong>${esc(c.name)}</strong> wil een offerte. Je scans van deze maand zijn op, dus de klant heeft geen foto's gemaakt en geen prijs gekregen. Bel of mail hem terug.</p>
          <table style="border-collapse:collapse;font-size:14px">${rows
            .map(
              ([k, v]) =>
                `<tr><td style="padding:4px 16px 4px 0;color:#64748b">${k}</td><td style="padding:4px 0">${esc(v)}</td></tr>`,
            )
            .join("")}</table>
          <p style="margin-top:20px">Wil je dat klanten weer direct een prijs krijgen? <a href="${esc(appUrl())}/dashboard/abonnement" style="color:#1a73e8">Kies een groter pakket</a>.</p>
          <p><a href="${esc(appUrl())}/dashboard/leads/${lead.id}" style="color:#1a73e8">Bekijk de aanvraag</a></p>
        </div>`,
      })
      .catch(() => {});
  }

  return json({ ok: true });
}
