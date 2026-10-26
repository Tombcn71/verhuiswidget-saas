"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { updateTariffs, type TariffFormState } from "./actions";
import { TariffImport } from "./tariff-import";
import type { ExtractedTariffs } from "@/lib/gemini";
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

type PricingMode = "uur" | "m3";

const selectCls =
  "h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Klein getalveld zonder label, voor in een zin ("30 m³ in 5,5 uur met 3 man"). */
function Mini({
  name,
  defaultValue,
  error,
  width = "w-20",
}: {
  name: string;
  defaultValue: string;
  error?: string;
  width?: string;
}) {
  return (
    <Input
      id={name}
      name={name}
      defaultValue={defaultValue}
      inputMode="decimal"
      aria-invalid={!!error}
      className={cn(width, "inline-flex tabular-nums")}
    />
  );
}

/** Uurtarief, wagen, ploeg, tempo, reistijd, minimum en afronding — zoals een verhuizer rekent. */
function WorkTariffs({ company, errors }: { company: Company; errors: Record<string, string> }) {
  const err = (...names: string[]) =>
    names.map((n) => errors[n]).find(Boolean) ?? null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Arbeid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Uurtarief per verhuizer"
            name="hourlyRatePerMover"
            defaultValue={money(company.hourlyRatePerMoverCents)}
            error={errors.hourlyRatePerMover}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="vanRate">Verhuiswagen</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  €
                </span>
                <Input
                  id="vanRate"
                  name="vanRate"
                  defaultValue={money(company.vanRateCents)}
                  inputMode="decimal"
                  aria-invalid={!!errors.vanRate}
                  className="pl-7 tabular-nums"
                />
              </div>
              <select name="vanRateUnit" defaultValue={company.vanRateUnit} className={selectCls}>
                <option value="uur">per uur</option>
                <option value="dag">per dag</option>
                <option value="rit">per rit</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Laat op €0 als de wagen al in je uurtarief zit.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Ploeg</Label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            tot <Mini name="crewTwoMaxM3" defaultValue={String(company.crewTwoMaxM3)} error={errors.crewTwoMaxM3} /> m³
            → 2 man
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            tot <Mini name="crewThreeMaxM3" defaultValue={String(company.crewThreeMaxM3)} error={errors.crewThreeMaxM3} /> m³
            → 3 man
          </div>
          <p className="text-sm">daarboven → 4 man</p>
          {err("crewTwoMaxM3", "crewThreeMaxM3") && (
            <p className="text-xs text-destructive">{err("crewTwoMaxM3", "crewThreeMaxM3")}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Tempo</Label>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Mini name="tempoM3" defaultValue={String(Number(company.tempoM3))} error={errors.tempoM3} /> m³ in
            <Mini name="tempoHours" defaultValue={String(Number(company.tempoHours))} error={errors.tempoHours} /> uur
            werk met
            <Mini name="tempoMovers" width="w-16" defaultValue={String(company.tempoMovers)} error={errors.tempoMovers} /> man
          </div>
          <p className="text-xs text-muted-foreground">
            Inladen en uitladen samen, zonder rijden. Hiermee rekent de app de uren uit.
          </p>
          {err("tempoM3", "tempoHours", "tempoMovers") && (
            <p className="text-xs text-destructive">{err("tempoM3", "tempoHours", "tempoMovers")}</p>
          )}
        </div>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Reistijd telt mee in de uren</legend>
          {(
            [
              ["rit", "Alleen de rit van ophaal- naar bezorgadres"],
              ["loods", "Vanaf je loods en terug (vestigingsadres bij Bedrijf)"],
              ["geen", "Niet, ik reken alleen de kilometers"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="travelMode"
                value={value}
                defaultChecked={company.travelMode === value}
                className="accent-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Minimaal aantal uren"
            name="minHours"
            unit="none"
            suffix="uur"
            defaultValue={String(Number(company.minHours))}
            error={errors.minHours}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="roundingMinutes">Afronden op</Label>
            <select
              id="roundingMinutes"
              name="roundingMinutes"
              defaultValue={String(company.roundingMinutes)}
              className={selectCls}
            >
              <option value="15">kwartier</option>
              <option value="30">half uur</option>
              <option value="60">heel uur</option>
            </select>
          </div>
          <Field
            label="Extra tijd per verdieping zonder lift"
            name="stairMinutesPerFloor"
            unit="none"
            suffix="min"
            defaultValue={String(company.stairMinutesPerFloor)}
            hint="Per verdieping, bij ophalen én afleveren."
            error={errors.stairMinutesPerFloor}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BaseTariffs({
  company,
  errors,
  withMoveExtras,
  mode,
  setMode,
}: {
  company: Company;
  errors: Record<string, string>;
  withMoveExtras: boolean;
  mode: PricingMode;
  setMode: (m: PricingMode) => void;
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Hoe reken jij?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input type="hidden" name="pricingMode" value={mode} />
          <div
            role="radiogroup"
            aria-label="Rekenmethode"
            className="inline-flex items-center rounded-full border border-border bg-background p-1 text-sm font-medium shadow-sm"
          >
            {(
              [
                { key: "uur", label: "Per uur" },
                { key: "m3", label: "Per m³" },
              ] as const
            ).map((o) => (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={mode === o.key}
                onClick={() => setMode(o.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 transition",
                  mode === o.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {mode === "uur"
              ? "De app rekent uit hoeveel verhuizers en uren de inboedel uit de scan kost, tegen jouw uurtarief."
              : "De app rekent het volume uit de scan × jouw prijs per m³. Mankracht zit daarin."}
          </p>
        </CardContent>
      </Card>

      <Group title="Basis">
        <Field label="Voorrijkosten / basistarief" name="baseFee" defaultValue={money(company.baseFeeCents)} error={errors.baseFee} />
        {/* Verborgen i.p.v. weggelaten, zodat de waarde bewaard blijft bij wisselen. */}
        <div className={cn(mode !== "m3" && "hidden")}>
          <Field
            label="Prijs per m³ inboedel"
            name="pricePerM3"
            defaultValue={money(company.pricePerM3Cents)}
            hint="Alles inbegrepen: mankracht, laden en lossen."
            error={errors.pricePerM3}
          />
        </div>
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
          hint="Hoeveel m³ past er in je verhuiswagen? Een gewone bakwagen is 30 tot 50 m³. Hiermee rekent de app uit hoeveel ritten nodig zijn."
          error={errors.truckCapacityM3}
        />
        <Field label="Minimale offerteprijs" name="minPrice" defaultValue={money(company.minPriceCents)} error={errors.minPrice} />
      </Group>

      <div className={cn(mode !== "uur" && "hidden")}>
        <WorkTariffs company={company} errors={errors} />
      </div>

      <Group title="Toeslagen">
        <Field
          label="Toeslag per verdieping"
          name="moveFloorSurcharge"
          defaultValue={money(company.moveFloorSurchargeCents)}
          hint={
            mode === "uur"
              ? "Optioneel vast bedrag. Trappen tellen al mee als extra tijd (zie Arbeid)."
              : "Vast bedrag per verdieping zonder lift."
          }
          error={errors.moveFloorSurcharge}
        />
        <Field label="Verhuislift" name="liftFee" defaultValue={money(company.liftFeeCents)} hint="Ook automatisch bij etage 3+ zonder lift." error={errors.liftFee} />
        <Field label="Slechte bereikbaarheid" name="truckAccess" defaultValue={money(company.truckAccessSurchargeCents)} hint="Wagen kan niet voor de deur." error={errors.truckAccess} />
        <Field label="Spoedtoeslag" name="rushSurcharge" defaultValue={money(company.rushSurchargeCents)} hint="Voorkeursdatum binnen 48 uur." error={errors.rushSurcharge} />
        <Field
          label="Zaterdagtoeslag"
          name="saturdaySurchargePct"
          unit="%"
          defaultValue={String(company.saturdaySurchargePct)}
          hint={mode === "uur" ? "Over de mankracht." : "Over de inboedel."}
          error={errors.saturdaySurchargePct}
        />
        <Field
          label="Zondagtoeslag"
          name="sundaySurchargePct"
          unit="%"
          defaultValue={String(company.sundaySurchargePct)}
          hint={mode === "uur" ? "Over de mankracht." : "Over de inboedel."}
          error={errors.sundaySurchargePct}
        />
      </Group>

      <Group title="Extra opties">
        <Field label="Inpakservice" name="packingFee" defaultValue={money(company.packingFeeCents)} error={errors.packingFee} />
        {withMoveExtras && (
          <>
            <Field label="Meubelmontage en -demontage" name="assemblyFee" defaultValue={money(company.assemblyFeeCents)} error={errors.assemblyFee} />
            <Field
              label="Verhuisdoos (per stuk)"
              name="boxPrice"
              defaultValue={money(company.boxPriceCents)}
              hint="Je klant kan dozen laten bezorgen; het aantal komt uit de scan. €0 = niet aanbieden."
              error={errors.boxPrice}
            />
            <Field label="Opslag per maand" name="storagePerMonth" defaultValue={money(company.storagePerMonthCents)} error={errors.storagePerMonth} />
          </>
        )}
        {/* verborgen velden zodat de niet-getoonde tarieven niet op 0 worden gezet */}
        {!withMoveExtras && (
          <>
            <input type="hidden" name="assemblyFee" value={money(company.assemblyFeeCents)} />
            <input type="hidden" name="boxPrice" value={money(company.boxPriceCents)} />
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
  mode,
  setMode,
}: {
  company: Company;
  errors: Record<string, string>;
  mode: PricingMode;
  setMode: (m: PricingMode) => void;
}) {
  return (
    <div className="space-y-8">
      <BaseTariffs company={company} errors={errors} withMoveExtras mode={mode} setMode={setMode} />
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
  mode,
  setMode,
}: {
  company: Company;
  errors: Record<string, string>;
  mode: PricingMode;
  setMode: (m: PricingMode) => void;
}) {
  return (
    <div className="space-y-4">
      <BaseTariffs company={company} errors={errors} withMoveExtras={false} mode={mode} setMode={setMode} />
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
  const [mode, setMode] = useState<PricingMode>(company.pricingMode === "m3" ? "m3" : "uur");
  const formRef = useRef<HTMLFormElement>(null);

  /** Zet waarden uit een factuur in het (ongecontroleerde) formulier. */
  function applyImport(t: ExtractedTariffs | null, values: Record<string, string>) {
    if (t?.pricingMode) setMode(t.pricingMode);
    for (const [name, value] of Object.entries(values)) {
      const el = formRef.current?.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.value = value;
      else if (el instanceof RadioNodeList) el.value = value;
    }
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <TariffImport apply={applyImport} />
      <div className="space-y-4">
        {combi ? (
          <div className="space-y-4">
            <BaseTariffs company={company} errors={e} withMoveExtras mode={mode} setMode={setMode} />
            <Group title="Ontruiming — extra werkzaamheden">
              <ClearanceExtras company={company} errors={e} />
            </Group>
          </div>
        ) : serviceType === "ontruimen" ? (
          <ClearanceTariffsFields company={company} errors={e} mode={mode} setMode={setMode} />
        ) : (
          <MoveTariffs company={company} errors={e} mode={mode} setMode={setMode} />
        )}
      </div>

      {/* Opslaan blijft onderin in beeld bij een lang formulier. */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Tarieven opslaan"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/preview">Test je tarieven</Link>
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
