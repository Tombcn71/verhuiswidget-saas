"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importAction, type ImportState } from "./actions";

const initial: ImportState = { status: "idle" };

/** Lijst plakken uit Excel/Google Sheets (of CSV), met kolomnamen op de eerste regel. */
export function ImportForm() {
  const [state, action, pending] = useActionState(importAction, initial);
  return (
    <form action={action} className="space-y-3">
      <Textarea
        name="table"
        rows={6}
        required
        className="font-mono text-xs"
        placeholder={`Bedrijf\tContactpersoon\tTelefoon\tPlaats\tE-mail\nJansen Verhuizingen\tPeter\t06 12345678\tUtrecht\tinfo@jansen.nl`}
      />
      <p className="text-xs text-muted-foreground">
        Selecteer in Excel of Google Sheets je kolommen (mét de kopregel), kopieer en plak hier.
        Herkende kolommen: Bedrijf, Contactpersoon, Telefoon, E-mail, Website, Plaats, Notities.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Importeren…" : "Importeren"}
        </Button>
        {state.message && (
          <span
            className={
              state.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"
            }
          >
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
