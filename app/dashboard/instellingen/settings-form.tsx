"use client";

import { useActionState } from "react";
import { updateSettings, type SettingsFormState } from "./actions";
import type { Company } from "@/lib/db";

const initialState: SettingsFormState = { status: "idle" };

function euro(cents: number): string {
  return (cents / 100).toFixed(2);
}

function Field({
  label,
  name,
  defaultValue,
  error,
  prefix,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  prefix?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-brand-600">
        {prefix ? <span className="pl-3 text-sm text-slate-400">{prefix}</span> : null}
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          inputMode={prefix === "€" ? "decimal" : undefined}
          className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SettingsForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateSettings, initialState);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Bedrijfsgegevens</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deze gegevens verschijnen in de widget en in de offerte-e-mails.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" name="name" defaultValue={company.name} error={e.name} />
          <Field
            label="Contact-e-mail"
            name="email"
            type="email"
            defaultValue={company.email}
            error={e.email}
            hint="Hierheen worden nieuwe aanvragen gestuurd."
          />
          <Field label="Telefoonnummer" name="phone" defaultValue={company.phone ?? ""} error={e.phone} />
          <Field
            label="Website"
            name="website"
            defaultValue={company.website ?? ""}
            error={e.website}
            hint="Bijv. https://jouwbedrijf.nl"
          />
          <Field
            label="Logo-URL"
            name="logoUrl"
            defaultValue={company.logoUrl ?? ""}
            error={e.logoUrl}
            hint="Directe link naar een afbeelding (png/svg)."
          />
          <Field
            label="Huisstijlkleur"
            name="primaryColor"
            defaultValue={company.primaryColor}
            error={e.primaryColor}
            hint="Hex-code, bijv. #2563eb"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Tarieven</h2>
        <p className="mt-1 text-sm text-slate-500">
          Alle bedragen zijn exclusief btw. De widget rekent hiermee de offerteprijs uit.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Voorrijkosten / basistarief" name="baseFee" prefix="€" defaultValue={euro(company.baseFeeCents)} error={e.baseFee} />
          <Field label="Prijs per m³ inboedel" name="pricePerM3" prefix="€" defaultValue={euro(company.pricePerM3Cents)} error={e.pricePerM3} />
          <Field label="Prijs per km (enkele reis)" name="pricePerKm" prefix="€" defaultValue={euro(company.pricePerKmCents)} error={e.pricePerKm} />
          <Field label="Inpakservice" name="packingFee" prefix="€" defaultValue={euro(company.packingFeeCents)} error={e.packingFee} />
          <Field label="Meubelmontage en -demontage" name="assemblyFee" prefix="€" defaultValue={euro(company.assemblyFeeCents)} error={e.assemblyFee} />
          <Field label="Opslag per maand" name="storagePerMonth" prefix="€" defaultValue={euro(company.storagePerMonthCents)} error={e.storagePerMonth} />
          <Field label="Minimale offerteprijs" name="minPrice" prefix="€" defaultValue={euro(company.minPriceCents)} error={e.minPrice} />
        </div>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Instellingen opslaan"}
        </button>
        {state.status === "success" && (
          <span className="text-sm font-medium text-green-600">{state.message}</span>
        )}
        {state.status === "error" && (
          <span className="text-sm font-medium text-red-600">{state.message}</span>
        )}
      </div>
    </form>
  );
}
