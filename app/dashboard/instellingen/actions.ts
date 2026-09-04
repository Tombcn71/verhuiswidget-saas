"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompany } from "@/lib/current-company";
import { updateCompanySettings } from "@/lib/companies";

const schema = z.object({
  name: z.string().trim().min(1, "Bedrijfsnaam is verplicht").max(120),
  serviceType: z.enum(["verhuizen", "ontruimen", "beide"]),
  email: z.email("Ongeldig e-mailadres"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  logoUrl: z.url("Ongeldige URL").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleur zoals #2563eb"),
});

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export async function updateCompany(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const company = await requireCompany();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] = issue.message;
    }
    return { status: "error", message: "Controleer de gemarkeerde velden.", errors };
  }

  const d = parsed.data;
  await updateCompanySettings(company.id, {
    name: d.name,
    serviceType: d.serviceType,
    email: d.email,
    phone: d.phone || null,
    website: d.website || null,
    logoUrl: d.logoUrl || null,
    primaryColor: d.primaryColor,
  });

  revalidatePath("/dashboard/instellingen");
  revalidatePath("/dashboard/tarieven");
  revalidatePath("/dashboard");
  return { status: "success", message: "Bedrijfsgegevens opgeslagen." };
}
