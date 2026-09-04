"use client";

import { useActionState, useState } from "react";
import { updateCompany, type SettingsFormState } from "./actions";
import type { Company } from "@/lib/db";

const initialState: SettingsFormState = { status: "idle" };

function Field({
  label,
  name,
  defaultValue,
  error,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-brand-600">
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export function SettingsForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompany, initialState);
  const e = state.errors ?? {};
  const [serviceType, setServiceType] = useState(company.serviceType);

  return (
    <form action={formAction} className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Bedrijfsgegevens</h2>
        <p className="mt-1 text-sm text-slate-500">
          Deze gegevens verschijnen in de widget en in de offerte-e-mails.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" name="name" defaultValue={company.name} error={e.name} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Welke dienst bied je aan?</span>
            <select
              name="serviceType"
              value={serviceType}
              onChange={(ev) => setServiceType(ev.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
            >
              <option value="verhuizen">Alleen verhuizen</option>
              <option value="ontruimen">Alleen ontruimen</option>
              <option value="beide">Verhuizen én ontruimen</option>
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              Bij &ldquo;beide&rdquo; kiest je klant in de widget zelf, en stel je bij{" "}
              <span className="font-medium">Tarieven</span> aparte prijzen per dienst in.
            </span>
            {e.serviceType ? (
              <span className="mt-1 block text-xs text-red-600">{e.serviceType}</span>
            ) : null}
          </label>
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

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Opslaan"}
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
