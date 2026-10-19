"use client";

import { useActionState, useState } from "react";
import { MapPin } from "lucide-react";
import { updateCompany, type SettingsFormState } from "./actions";
import type { Company } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LogoUpload } from "./logo-upload";

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
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} name={name} defaultValue={defaultValue} aria-invalid={!!error} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function SettingsForm({ company }: { company: Company }) {
  const [state, formAction, pending] = useActionState(updateCompany, initialState);
  const e = state.errors ?? {};
  const [serviceType, setServiceType] = useState(company.serviceType);
  const [color, setColor] = useState(company.primaryColor);

  return (
    <form action={formAction} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bedrijfsgegevens</CardTitle>
          <CardDescription>
            Deze gegevens verschijnen in de widget en in de offerte-e-mails.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" name="name" defaultValue={company.name} error={e.name} />
          <div className="grid gap-1.5">
            <Label htmlFor="serviceType">Welke dienst bied je aan?</Label>
            <Select name="serviceType" value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger id="serviceType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verhuizen">Alleen verhuizen</SelectItem>
                <SelectItem value="ontruimen">Alleen ontruimen</SelectItem>
                <SelectItem value="beide">Verhuizen én ontruimen</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Bij &ldquo;beide&rdquo; kiest je klant in de widget zelf, en stel je bij Tarieven
              aparte prijzen per dienst in.
            </p>
            {e.serviceType ? <p className="text-xs text-destructive">{e.serviceType}</p> : null}
          </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Huisstijl</CardTitle>
          <CardDescription>Je klanten zien je logo en kleur in de widget en de e-mails.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <LogoUpload
            companyId={company.id}
            defaultValue={company.logoUrl ?? ""}
            error={e.logoUrl}
          />
          <div className="grid content-start gap-1.5">
            <Label htmlFor="primaryColor">Huisstijlkleur</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Kleur kiezen"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : "#1a73e8"}
                onChange={(ev) => setColor(ev.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <Input
                id="primaryColor"
                name="primaryColor"
                value={color}
                onChange={(ev) => setColor(ev.target.value)}
                aria-invalid={!!e.primaryColor}
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">Kies een kleur of vul een hex-code in.</p>
            {e.primaryColor ? <p className="text-xs text-destructive">{e.primaryColor}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-mailhandtekening</CardTitle>
          <CardDescription>
            Komt onderaan de offerte-mail aan je klant. Leeg laten = &ldquo;Met vriendelijke
            groet, {company.name}&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1.5">
          <Textarea
            name="emailSignature"
            defaultValue={company.emailSignature ?? ""}
            rows={5}
            maxLength={1000}
            aria-invalid={!!e.emailSignature}
            placeholder={`Met vriendelijke groet,\n\nJan de Vries\n${company.name}\n06 12345678 · www.jouwbedrijf.nl`}
          />
          {e.emailSignature ? <p className="text-xs text-destructive">{e.emailSignature}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vestigingsadres</CardTitle>
          <CardDescription>
            Waar je wagens vertrekken. Hiermee rekent de offerte ook de aan- en afrijkilometers
            (vestiging → ophaaladres, en na afloop terug), tegen je prijs per km. Leeg laten =
            geen aanrijkilometers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Postcode"
              name="basePostcode"
              defaultValue={company.basePostcode ?? ""}
              error={e.basePostcode}
              hint="Bijv. 3511 AR"
            />
            <Field
              label="Huisnummer"
              name="baseHouseNumber"
              defaultValue={company.baseHouseNumber ?? ""}
            />
          </div>
          {company.baseAddress && (
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 text-primary" />
              <span className="font-medium">{company.baseAddress}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opslaan blijft onderin in beeld bij een lang formulier. */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t bg-background/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
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
