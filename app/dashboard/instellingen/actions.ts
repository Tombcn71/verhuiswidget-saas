"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCompany } from "@/lib/current-company";
import { updateCompanySettings } from "@/lib/companies";

const euros = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const n = Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Ongeldig bedrag" });
      return z.NEVER;
    }
    return n;
  });

const schema = z.object({
  name: z.string().trim().min(1, "Bedrijfsnaam is verplicht").max(120),
  email: z.email("Ongeldig e-mailadres"),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  logoUrl: z.url("Ongeldige URL").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleur zoals #2563eb"),
  baseFee: euros,
  pricePerM3: euros,
  pricePerKm: euros,
  packingFee: euros,
  assemblyFee: euros,
  storagePerMonth: euros,
  minPrice: euros,
});

export type SettingsFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
};

export async function updateSettings(
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
  const toCents = (n: number) => Math.round(n * 100);

  await updateCompanySettings(company.id, {
    name: d.name,
    email: d.email,
    phone: d.phone || null,
    website: d.website || null,
    logoUrl: d.logoUrl || null,
    primaryColor: d.primaryColor,
    baseFeeCents: toCents(d.baseFee),
    pricePerM3Cents: toCents(d.pricePerM3),
    pricePerKmCents: toCents(d.pricePerKm),
    packingFeeCents: toCents(d.packingFee),
    assemblyFeeCents: toCents(d.assemblyFee),
    storagePerMonthCents: toCents(d.storagePerMonth),
    minPriceCents: toCents(d.minPrice),
  });

  revalidatePath("/dashboard/instellingen");
  revalidatePath("/dashboard");
  return { status: "success", message: "Instellingen opgeslagen." };
}
