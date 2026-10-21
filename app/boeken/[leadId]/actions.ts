"use server";

import { redirect } from "next/navigation";
import { getCompanyById } from "@/lib/companies";
import { acceptLead } from "@/lib/leads";
import { hasAccess } from "@/lib/plans";
import { sendBookingConfirmation, sendBookingNotification } from "@/lib/email";
import { appUrl } from "@/lib/app-url";

/**
 * De klant bevestigt de boeking. Pas hier (na een klik op de pagina) wordt de
 * lead "akkoord": e-mailscanners die links vooraf openen, boeken dus niets.
 */
export async function confirmBooking(formData: FormData): Promise<void> {
  const leadId = String(formData.get("leadId") ?? "");
  const token = String(formData.get("t") ?? "");

  const lead = await acceptLead(leadId, token);
  if (lead) {
    const company = await getCompanyById(lead.companyId);
    if (company) {
      // Verhuizer een seintje, klant een bevestiging van z'n verzoek.
      await Promise.all([
        sendBookingNotification({
          company,
          customerName: lead.customerName,
          customerEmail: lead.customerEmail,
          customerPhone: lead.customerPhone,
          moveType: lead.moveType,
          moveDate: lead.moveDate,
          totalCents: lead.totalCents,
          leadUrl: `${appUrl()}/dashboard/leads/${lead.id}`,
          showDetails: hasAccess(company),
        }),
        sendBookingConfirmation({
          company,
          customerName: lead.customerName,
          customerEmail: lead.customerEmail,
          moveType: lead.moveType,
          moveDate: lead.moveDate,
          fromAddress: lead.fromAddress,
          toAddress: lead.toAddress,
          totalCents: lead.totalCents,
        }),
      ]);
    }
  }

  redirect(`/boeken/${encodeURIComponent(leadId)}?t=${encodeURIComponent(token)}`);
}
