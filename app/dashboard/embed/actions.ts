"use server";

import { z } from "zod";
import { requireCompany } from "@/lib/current-company";
import { ensureCompanySlug } from "@/lib/companies";
import { appUrl } from "@/lib/app-url";
import { sendLinkEmail } from "@/lib/email";

/** Mailt het linkje met het bericht naar de klant, namens de verhuizer. */
export async function mailLink(
  to: string,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = z.email().safeParse(to.trim());
  if (!email.success) return { ok: false, error: "Vul een geldig e-mailadres in." };
  const text = message.trim().slice(0, 2000);
  if (!text) return { ok: false, error: "Het bericht is leeg." };

  const company = await requireCompany();
  const link = `${appUrl().replace("://www.", "://")}/offerte/${await ensureCompanySlug(company)}`;
  const { sent } = await sendLinkEmail({ company, to: email.data, message: text, link });
  return sent ? { ok: true } : { ok: false, error: "Versturen mislukte. Probeer het nog een keer." };
}
