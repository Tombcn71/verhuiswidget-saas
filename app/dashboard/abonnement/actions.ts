"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminCompany } from "@/lib/current-company";
import { countMembers, setCompanyPlan } from "@/lib/companies";
import { PLANS, normalizePlan, trialState } from "@/lib/plans";

/**
 * Wisselt van plan. Kan nu alleen tijdens de proefperiode; daarna loopt het via
 * Stripe (fase 4).
 */
export async function choosePlan(formData: FormData): Promise<void> {
  const company = await requireAdminCompany();
  const plan = PLANS[normalizePlan(formData.get("plan"))];

  if (trialState(company).kind !== "trial") {
    redirect("/dashboard/abonnement?fout=betalen");
  }

  const members = await countMembers(company);
  if (members > plan.seats) {
    redirect(`/dashboard/abonnement?fout=teamleden&plan=${plan.id}`);
  }

  await setCompanyPlan(company.id, plan.id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/abonnement");
}
