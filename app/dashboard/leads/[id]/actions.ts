"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/current-company";
import { updateLeadStatus } from "@/lib/leads";

const ALLOWED = ["nieuw", "gecontacteerd", "gewonnen", "verloren"];

export async function setLeadStatus(formData: FormData) {
  const company = await requireCompany();
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!leadId || !ALLOWED.includes(status)) return;

  await updateLeadStatus(company.id, leadId, status);
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}
