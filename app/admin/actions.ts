"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  checkProspectSites,
  createProspect,
  deleteProspect,
  fetchNewProspects,
  getProspect,
  importProspects,
  isStage,
  markWhatsapp,
  parseProspectTable,
  updateProspect,
} from "@/lib/prospects";
import { PlacesConfigError } from "@/lib/places";
import { cancelAutoMails, sendDemoMail } from "@/lib/prospect-mails";

export type ImportState = { status: "idle" | "success" | "error"; message?: string };

/** Geplakte lijst (Excel/Sheets/CSV) inlezen. */
export async function importAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();
  const { rows, unknownColumns } = parseProspectTable(String(formData.get("table") ?? ""));
  if (rows.length === 0) {
    return {
      status: "error",
      message:
        "Geen bedrijven gevonden. Zet de kolomnamen in de eerste regel, met minstens een kolom 'Bedrijf'.",
    };
  }
  const { added, skipped } = await importProspects(rows);
  revalidatePath("/admin");
  return {
    status: "success",
    message: `${added} ${added === 1 ? "bedrijf" : "bedrijven"} toegevoegd.${
      skipped ? ` ${skipped} overgeslagen (stond er al in).` : ""
    }${unknownColumns.length ? ` Genegeerde kolommen: ${unknownColumns.join(", ")}.` : ""}`,
  };
}

const text = (formData: FormData, key: string) => {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
};

/** Eén bedrijf toevoegen en meteen openen. */
export async function createAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const companyName = text(formData, "companyName");
  if (!companyName) return;
  const p = await createProspect({
    companyName,
    contactName: text(formData, "contactName"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    city: text(formData, "city"),
  });
  redirect(`/admin/prospects/${p.id}`);
}

/** Gegevens, fase, notities en volgende actie bijwerken. */
/** WhatsApp-veld: "06 1234 5678" → "31612345678"; anders "ja" (chat op hun site) of leeg. */
function whatsappValue(v: string | null): string | null {
  if (!v) return null;
  const digits = v.replace(/\D/g, "");
  if (digits.length < 8) return "ja";
  return digits.startsWith("0") ? `31${digits.replace(/^0+/, "")}` : digits;
}

export async function updateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const stage = formData.get("stage");
  const nextActionOn = text(formData, "nextActionOn");
  await updateProspect(id, {
    companyName: text(formData, "companyName") ?? undefined,
    contactName: text(formData, "contactName"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    whatsapp: whatsappValue(text(formData, "whatsapp")),
    city: text(formData, "city"),
    notes: text(formData, "notes"),
    nextAction: text(formData, "nextAction"),
    nextActionOn: nextActionOn && /^\d{4}-\d{2}-\d{2}$/.test(nextActionOn) ? nextActionOn : null,
    ...(isStage(stage) ? { stage } : {}),
    lostReason: stage === "afgevallen" ? text(formData, "lostReason") : null,
    mobile: text(formData, "mobile"),
    autoMailOff: formData.get("autoMailOff") === "on",
  });
  // Gesprek gepland/proef/klant/afgevallen of "niet meer mailen": geplande opvolgmails annuleren.
  const fresh = await getProspect(id);
  if (
    fresh &&
    (fresh.autoMailOff || ["gesprek", "proef", "klant", "afgevallen"].includes(fresh.stage))
  ) {
    await cancelAutoMails(fresh);
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/prospects/${id}`);
}

export async function deleteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await deleteProspect(String(formData.get("id") ?? ""));
  revalidatePath("/admin");
  redirect("/admin");
}

/** "Demo mailen": persoonlijke demolink per mail; herinnering wordt meteen ingepland. */
export async function demoMailAction(id: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin();
  const p = await getProspect(id);
  if (!p) return { ok: false, message: "Bedrijf niet gevonden." };
  const r = await sendDemoMail(p);
  revalidatePath("/admin");
  revalidatePath(`/admin/prospects/${id}`);
  return r.ok ? { ok: true, message: `Verstuurd naar ${p.email}` } : { ok: false, message: r.error };
}

export type FetchState = { status: "idle" | "success" | "error"; message?: string };

/** "Check websites": WhatsApp (en ontbrekende e-mail) van bestaande bedrijven ophalen. */
export async function checkSitesAction(): Promise<FetchState> {
  await requireAdmin();
  const r = await checkProspectSites();
  revalidatePath("/admin");
  if (r.checked === 0) return { status: "success", message: "Alle websites zijn al bekeken." };
  return {
    status: "success",
    message: `${r.checked} websites bekeken, ${r.whatsapp} met WhatsApp.${
      r.remaining ? ` Nog ${r.remaining} te doen: klik nog eens.` : ""
    }`,
  };
}

/** "Haal 20 nieuwe verhuisbedrijven" via Google Places (dubbelen overgeslagen). */
export async function fetchProspectsAction(_prev: FetchState, formData: FormData): Promise<FetchState> {
  await requireAdmin();
  const count = Math.min(60, Math.max(1, Number(formData.get("count")) || 20));
  const city = String(formData.get("city") ?? "").trim() || null;
  try {
    const r = await fetchNewProspects({ count, city });
    revalidatePath("/admin");
    if (r.added === 0) {
      return {
        status: "error",
        message: r.done
          ? city
            ? `Geen nieuwe verhuisbedrijven meer gevonden in ${city}.`
            : "Alle plaatsen in de lijst zijn doorzocht."
          : "Geen nieuwe bedrijven met WhatsApp gevonden; probeer het nog eens of kies een plaats.",
      };
    }
    return {
      status: "success",
      message: `${r.added} nieuwe ${r.added === 1 ? "verhuisbedrijf" : "verhuisbedrijven"} toegevoegd (${r.cities.join(", ")}).${
        r.skipped ? ` ${r.skipped} overgeslagen (stonden er al in).` : ""
      }${r.noWhatsapp ? ` ${r.noWhatsapp} zonder WhatsApp overgeslagen.` : ""}`,
    };
  } catch (err) {
    return {
      status: "error",
      message:
        err instanceof PlacesConfigError
          ? "Nog geen Google-sleutel: zet GOOGLE_PLACES_API_KEY in je env."
          : `Ophalen mislukt: ${err instanceof Error ? err.message : "onbekende fout"}`,
    };
  }
}

/** Openingsbericht of demolink via WhatsApp gestuurd (klik of kopieer in het CRM). */
export async function whatsappAction(id: string, kind: "opening" | "demo"): Promise<void> {
  await requireAdmin();
  await markWhatsapp(id, kind);
  revalidatePath("/admin");
  revalidatePath(`/admin/prospects/${id}`);
}
