"use server";

import { revalidatePath } from "next/cache";
import { requireCompany } from "@/lib/current-company";
import { getLeadForCompany, updateLeadStatus, updateLeadNotes } from "@/lib/leads";
import { isLeadLocked } from "@/lib/plans";
import type { Company } from "@/lib/db";

/** Afgeschermde leads (proef verlopen) zijn ook niet te bewerken. */
async function canEdit(company: Company, leadId: string): Promise<boolean> {
  const lead = await getLeadForCompany(company.id, leadId);
  return lead !== null && !isLeadLocked(company, lead);
}

const ALLOWED = ["nieuw", "gecontacteerd", "gewonnen", "verloren"];

export async function setLeadStatus(formData: FormData) {
  const company = await requireCompany();
  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!leadId || !ALLOWED.includes(status)) return;
  if (!(await canEdit(company, leadId))) return;

  await updateLeadStatus(company.id, leadId, status);
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function saveLeadNotes(formData: FormData) {
  const company = await requireCompany();
  const leadId = String(formData.get("leadId") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 4000);
  if (!leadId) return;
  if (!(await canEdit(company, leadId))) return;

  await updateLeadNotes(company.id, leadId, notes);
  revalidatePath(`/dashboard/leads/${leadId}`);
}
