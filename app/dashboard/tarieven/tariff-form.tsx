"use client";

import { useActionState } from "react";
import { updateTariffs, type TariffFormState } from "./actions";
import type { Company } from "@/lib/db";
import { CLEARANCE_TARIFF_DEFAULTS } from "@/lib/db/schema";
import type { ServiceType } from "@/lib/companies";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: TariffFormState = { status: "idle" };

const money = (cents: number) => (cents / 100).toFixed(2);

function Field({
  label,
  name,
  defaultValue,
  unit = "€",
  suffix,
  error,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  unit?: "€" | "%" | "none";
  suffix?: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div className="relative">
        {unit === "€" && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            €
          </span>
        )}
        <Input
          id={name}
          name={name}
          defaultValue={defaultValue}
          inputMode="decimal"
          aria-invalid={!!error}
          className={cn(unit === "€" && "pl-7", (unit === "%" || suffix) && "pr-12", "tabular-nums")}
        />
        {(unit === "%" || suffix) && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {unit === "%" ? "%" : suffix}
          </span>
        )}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

function BaseTariffs({
  company,
  errors,
  withMoveExtras,
}: {
  company: Company;
  errors: Record<string, string>;
  withMoveExtras: boolean;
}) {
  return (
    <>
      <Group title="Basis">
        <Field label="Voorrijkosten / basistarief" name="baseFee" defaultValue={money(company.baseFeeCents)} error={errors.baseFee} />
        <Field label="Prijs per m³ inboedel" name="pricePerM3" defaultValue={money(company.pricePerM3Cents)} error={errors.pricePerM3} />
        <Field
          label="Prijs per km"
          name="pricePerKm"
          defaultValue={money(company.pricePerKmCents)}
          error={errors.pricePerKm}
          hint="Voor de rit van ophaal- naar bezorgadres, en voor aan- en afrijden vanaf je vestigingsadres (in te stellen bij Bedrijf)."
        />
        <Field
          label="Laadvermogen wagen"
          name="truckCapacityM3"
          unit="none"
          suffix="m³"
          defaultValue={String(company.truckCapacityM3)}
          hint="m³ per rit — bepaalt het geschatte aantal ritten."
          error={errors.truckCapacityM3}
        />
        <Field label="Minimale offerteprijs" name="minPrice" defaultValue={money(company.minPriceCents)} error={errors.minPrice} />
      </Group>

      <Group title="Arbeid">
        <Field label="Uurtarief per verhuizer" name="hourlyRatePerMover" defaultValue={money(company.hourlyRatePerMoverCents)} error={errors.hourlyRatePerMover} />
        <Field
          label="Laadsnelheid"
          name="m3PerHourPerMover"
          defaultValue={String(company.m3PerHourPerMover)}
          hint="m³ per verhuizer per uur — bepaalt de geschatte uren."
          error={errors.m3PerHourPerMover}
        />
      </Group>

      <Group title="Toeslagen">
        <Field label="Toeslag per verdieping" name="moveFloorSurcharge" defaultValue={money(company.moveFloorSurchargeCents)} error={errors.moveFloorSurcharge} />
        <Field label="Verhuislift" name="liftFee" defaultValue={money(company.liftFeeCents)} hint="Ook automatisch bij etage 3+ zonder lift." error={errors.liftFee} />
        <Field label="Slechte bereikbaarheid" name="truckAccess" defaultValue={money(company.truckAccessSurchargeCents)} hint="Wagen kan niet voor de deur." error={errors.truckAccess} />
        <Field label="Spoedtoeslag" name="rushSurcharge" defaultValue={money(company.rushSurchargeCents)} hint="Voorkeursdatum binnen 48 uur." error={errors.rushSurcharge} />
      </Group>

      <Group title="Extra opties">
        <Field label="Inpakservice" name="packingFee" defaultValue={money(company.packingFeeCents)} error={errors.packingFee} />
        {withMoveExtras && (
          <>
            <Field label="Meubelmontage en -demontage" name="assemblyFee" defaultValue={money(company.assemblyFeeCents)} error={errors.assemblyFee} />
            <Field label="Opslag per maand" name="storagePerMonth" defaultValue={money(company.storagePerMonthCents)} error={errors.storagePerMonth} />
          </>
        )}
        {/* verborgen velden zodat de niet-getoonde tarieven niet op 0 worden gezet */}
        {!withMoveExtras && (
          <>
            <input type="hidden" name="assemblyFee" value={money(company.assemblyFeeCents)} />
            <input type="hidden" name="storagePerMonth" value={money(company.storagePerMonthCents)} />
          </>
        )}
      </Group>
    </>
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
      <BaseTariffs company={company} errors={errors} withMoveExtras />
    </div>
  );
}

const FLOOR_FIELDS = [
  { name: "clFloorLaminaat", label: "Laminaat (niet gelijmd)", key: "floorLaminaatCents" },
  { name: "clFloorTapijt", label: "Tapijt / vloerbedekking", key: "floorTapijtCents" },
  { name: "clFloorPvcClick", label: "PVC click", key: "floorPvcClickCents" },
  { name: "clFloorKurk", label: "Kurkvloer", key: "floorKurkCents" },
  { name: "clFloorPvcGelijmd", label: "PVC gelijmd", key: "floorPvcGelijmdCents" },
  { name: "clFloorParketGelijmd", label: "Parket gelijmd", key: "floorParketGelijmdCents" },
  { name: "clFloorTegelvloer", label: "Tegelvloer", key: "floorTegelvloerCents" },
] as const;

function ClearanceExtras({
  company,
  errors,
}: {
  company: Company;
  errors: Record<string, string>;
}) {
  const t = { ...CLEARANCE_TARIFF_DEFAULTS, ...(company.ontruimenTariffs ?? {}) };
  return (
    <>
      <Field label="Behang verwijderen (per m²)" name="clWallpaper" defaultValue={money(t.wallpaperPerM2Cents)} error={errors.clWallpaper} />
      <Field label="Gaatjes stoppen (per stuk)" name="clHoles" defaultValue={money(t.holesPerUnitCents)} error={errors.clHoles} />
      <Field label="Schilderwerk (per m²)" name="clPaint" defaultValue={money(t.paintPerM2Cents)} error={errors.clPaint} />
      <Field label="Gordijnen verwijderen (vast)" name="clCurtains" defaultValue={money(t.curtainsCents)} error={errors.clCurtains} />
      <Field label="Afvoer & transport (per rit)" name="clHaul" defaultValue={money(t.haulPerTripCents)} hint="Rit naar de milieustraat incl. stortkosten. Aantal ritten = volume ÷ laadvermogen wagen." error={errors.clHaul} />
      {FLOOR_FIELDS.map((f) => (
        <Field
          key={f.name}
          label={`Vloer: ${f.label} (per m²)`}
          name={f.name}
          defaultValue={money(t[f.key])}
          error={errors[f.name]}
        />
      ))}
    </>
  );
}

function ClearanceTariffsFields({
  company,
  errors,
}: {
  company: Company;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <BaseTariffs company={company} errors={errors} withMoveExtras={false} />
      <Group title="Extra werkzaamheden">
        <ClearanceExtras company={company} errors={errors} />
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
  const combi = serviceType === "beide";

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4">
        {combi ? (
          <div className="space-y-4">
            <BaseTariffs company={company} errors={e} withMoveExtras />
            <Group title="Ontruiming — extra werkzaamheden">
              <ClearanceExtras company={company} errors={e} />
            </Group>
          </div>
        ) : serviceType === "ontruimen" ? (
          <ClearanceTariffsFields company={company} errors={e} />
        ) : (
          <MoveTariffs company={company} errors={e} />
        )}
      </div>

      {/* Opslaan blijft onderin in beeld bij een lang formulier. */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Tarieven opslaan"}
        </Button>
        {state.status === "success" && (
          <span className="text-sm font-medium text-emerald-600">{state.message}</span>
        )}
        {state.status === "error" && (
          <span className="text-sm font-medium text-destructive">{state.message}</span>
        )}
      </div>
    </form>
  );
}
