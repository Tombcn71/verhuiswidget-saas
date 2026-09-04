"use client";

import { useActionState, useState } from "react";
import { updateTariffs, type TariffFormState } from "./actions";
import type { Company } from "@/lib/db";
import { CLEARANCE_TARIFF_DEFAULTS } from "@/lib/db/schema";
import type { ServiceType } from "@/lib/companies";

const initialState: TariffFormState = { status: "idle" };

const money = (cents: number) => (cents / 100).toFixed(2);

function Field({
  label,
  name,
  defaultValue,
  unit = "€",
  error,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  unit?: "€" | "%";
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-brand-600">
        {unit === "€" && <span className="pl-3 text-sm text-slate-400">€</span>}
        <input
          name={name}
          defaultValue={defaultValue}
          inputMode="decimal"
          className="w-full rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
        />
        {unit === "%" && <span className="pr-3 text-sm text-slate-400">%</span>}
      </div>
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function MoveTariffs({
  company,
  errors,
}: {
  company: Company;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-8">
      <Group title="Basis">
        <Field label="Voorrijkosten / basistarief" name="baseFee" defaultValue={money(company.baseFeeCents)} error={errors.baseFee} />
        <Field label="Prijs per m³ inboedel" name="pricePerM3" defaultValue={money(company.pricePerM3Cents)} error={errors.pricePerM3} />
        <Field label="Prijs per km (enkele reis)" name="pricePerKm" defaultValue={money(company.pricePerKmCents)} error={errors.pricePerKm} />
        <Field label="Minimale offerteprijs" name="minPrice" defaultValue={money(company.minPriceCents)} error={errors.minPrice} />
      </Group>

      <Group title="Toeslagen">
        <Field label="Toeslag per verdieping (per adres)" name="moveFloorSurcharge" defaultValue={money(company.moveFloorSurchargeCents)} error={errors.moveFloorSurcharge} />
        <Field label="Verhuislift (per adres)" name="liftFee" defaultValue={money(company.liftFeeCents)} error={errors.liftFee} />
      </Group>

      <Group title="Extra opties">
        <Field label="Inpakservice" name="packingFee" defaultValue={money(company.packingFeeCents)} error={errors.packingFee} />
        <Field label="Meubelmontage en -demontage" name="assemblyFee" defaultValue={money(company.assemblyFeeCents)} error={errors.assemblyFee} />
        <Field label="Opslag per maand" name="storagePerMonth" defaultValue={money(company.storagePerMonthCents)} error={errors.storagePerMonth} />
      </Group>
    </div>
  );
}

function ClearanceTariffsFields({
  company,
  errors,
}: {
  company: Company;
  errors: Record<string, string>;
}) {
  const t = { ...CLEARANCE_TARIFF_DEFAULTS, ...(company.ontruimenTariffs ?? {}) };
  return (
    <div className="space-y-8">
      <Group title="Basis">
        <Field label="Prijs per m²" name="clPricePerM2" defaultValue={money(t.pricePerM2Cents)} hint="Wordt vermenigvuldigd met het aantal m² en de vulgraad-factor." error={errors.clPricePerM2} />
        <Field label="Transport & verwerking (vast)" name="clTransport" defaultValue={money(t.transportCents)} error={errors.clTransport} />
        <Field label="Minimale offerteprijs" name="clMinPrice" defaultValue={money(t.minPriceCents)} error={errors.clMinPrice} />
      </Group>

      <Group title="Vulgraad-factor (% van de basisprijs, bepaald door de AI)">
        <Field label="Minimaal bewoond" name="clFillMinimaal" unit="%" defaultValue={String(t.fillFactorMinimaal)} error={errors.clFillMinimaal} />
        <Field label="Normaal bewoond" name="clFillNormaal" unit="%" defaultValue={String(t.fillFactorNormaal)} error={errors.clFillNormaal} />
        <Field label="Vol" name="clFillVol" unit="%" defaultValue={String(t.fillFactorVol)} error={errors.clFillVol} />
        <Field label="Overvol" name="clFillOvervol" unit="%" defaultValue={String(t.fillFactorOvervol)} error={errors.clFillOvervol} />
      </Group>

      <Group title="Verdieping">
        <Field label="Toeslag per verdieping" name="clFloorSurcharge" defaultValue={money(t.floorSurchargeCents)} error={errors.clFloorSurcharge} />
        <Field label="Extra toeslag als er geen lift is" name="clNoLiftSurcharge" defaultValue={money(t.noLiftSurchargeCents)} error={errors.clNoLiftSurcharge} />
      </Group>

      <Group title="Extra werkzaamheden">
        <Field label="Behang verwijderen (per m²)" name="clWallpaper" defaultValue={money(t.wallpaperPerM2Cents)} error={errors.clWallpaper} />
        <Field label="Gaatjes stoppen (per m²)" name="clHoles" defaultValue={money(t.holesPerM2Cents)} error={errors.clHoles} />
        <Field label="Schilderwerk (per m²)" name="clPaint" defaultValue={money(t.paintPerM2Cents)} error={errors.clPaint} />
        <Field label="Vloer verwijderen (per m²)" name="clFloorRemoval" defaultValue={money(t.floorRemovalPerM2Cents)} error={errors.clFloorRemoval} />
        <Field label="Gordijnen verwijderen (vast)" name="clCurtains" defaultValue={money(t.curtainsCents)} error={errors.clCurtains} />
      </Group>
    </div>
  );
}

export function TariffForm({
  company,
  serviceType,
}: {
  company: Company;
  serviceType: ServiceType;
}) {
  const [state, formAction, pending] = useActionState(updateTariffs, initialState);
  const e = state.errors ?? {};
  const [tab, setTab] = useState<"verhuizen" | "ontruimen">(
    serviceType === "ontruimen" ? "ontruimen" : "verhuizen",
  );
  const combi = serviceType === "beide";

  return (
    <form action={formAction} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        {combi ? (
          <>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
              {(["verhuizen", "ontruimen"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  className={`rounded-md px-3 py-1.5 font-medium capitalize ${
                    tab === k
                      ? "bg-brand-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <div className="mt-6" hidden={tab !== "verhuizen"}>
              <MoveTariffs company={company} errors={e} />
            </div>
            <div className="mt-6" hidden={tab !== "ontruimen"}>
              <ClearanceTariffsFields company={company} errors={e} />
            </div>
          </>
        ) : serviceType === "ontruimen" ? (
          <ClearanceTariffsFields company={company} errors={e} />
        ) : (
          <MoveTariffs company={company} errors={e} />
        )}
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Tarieven opslaan"}
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
