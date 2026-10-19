"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminCompany } from "@/lib/current-company";
import { updateCompanySettings } from "@/lib/companies";
import { lookupAddress, normalizePostcode } from "@/lib/geo";

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
    .regex(/^#[0-9a-fA-F]{6}$/, "Gebruik een hex-kleur zoals #1a73e8"),
  emailSignature: z.string().trim().max(1000, "Maximaal 1000 tekens").optional().or(z.literal("")),
  basePostcode: z.string().trim().max(10).optional().or(z.literal("")),
  baseHouseNumber: z.string().trim().max(10).optional().or(z.literal("")),
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
  const company = await requireAdminCompany();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0])] = issue.message;
    }
    return { status: "error", message: "Controleer de gemarkeerde velden.", errors };
  }

  const d = parsed.data;

  // Vestigingsadres: leeg = geen aanrijkilometers; anders moet het bestaan.
  let base = { basePostcode: null, baseHouseNumber: null, baseAddress: null, baseLat: null, baseLon: null } as {
    basePostcode: string | null;
    baseHouseNumber: string | null;
    baseAddress: string | null;
    baseLat: number | null;
    baseLon: number | null;
  };
  if (d.basePostcode || d.baseHouseNumber) {
    const found =
      d.basePostcode && d.baseHouseNumber
        ? await lookupAddress(d.basePostcode, d.baseHouseNumber)
        : null;
    if (!found) {
      return {
        status: "error",
        message: "Controleer de gemarkeerde velden.",
        errors: { basePostcode: "Dit adres bestaat niet. Controleer postcode en huisnummer." },
      };
    }
    base = {
      basePostcode: normalizePostcode(d.basePostcode!),
      baseHouseNumber: d.baseHouseNumber!,
      baseAddress: found.label,
      baseLat: found.lat,
      baseLon: found.lon,
    };
  }

  await updateCompanySettings(company.id, {
    ...base,
    name: d.name,
    serviceType: d.serviceType,
    email: d.email,
    phone: d.phone || null,
    website: d.website || null,
    emailSignature: d.emailSignature || null,
    logoUrl: d.logoUrl || null,
    primaryColor: d.primaryColor,
  });

  revalidatePath("/dashboard/instellingen");
  revalidatePath("/dashboard/tarieven");
  revalidatePath("/dashboard");
  return { status: "success", message: "Bedrijfsgegevens opgeslagen." };
}
