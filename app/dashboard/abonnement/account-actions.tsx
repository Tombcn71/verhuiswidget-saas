"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteAccount, setCancelAtPeriodEnd, type DeleteAccountState } from "./actions";

function Submit({
  children,
  variant,
  disabled,
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending || disabled}>
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}

/** Opzeggen (loopt door tot `endsOn`) of een opzegging terugdraaien. */
export function CancelSubscription({
  endsOn,
  cancelled,
}: {
  /** Datum als tekst, bv. "12 november 2026". */
  endsOn: string | null;
  cancelled: boolean;
}) {
  const [asking, setAsking] = useState(false);

  if (cancelled) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Abonnement opgezegd</CardTitle>
          <CardDescription>
            Je kunt moverAI gewoon gebruiken{endsOn ? ` tot ${endsOn}` : " tot het einde van je periode"}.
            Daarna stopt je abonnement en betaal je niets meer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setCancelAtPeriodEnd}>
            <input type="hidden" name="doorgaan" value="1" />
            <Submit>Toch doorgaan met moverAI</Submit>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Abonnement opzeggen</CardTitle>
        <CardDescription>
          Je abonnement loopt door{endsOn ? ` tot ${endsOn}` : " tot het einde van je periode"}. Daarna
          betaal je niets meer. Je gegevens blijven bewaard, dus je kunt later zo weer verder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {asking ? (
          <form action={setCancelAtPeriodEnd} className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Weet je het zeker?</span>
            <Submit variant="destructive">Ja, opzeggen</Submit>
            <Button type="button" variant="outline" onClick={() => setAsking(false)}>
              Nee
            </Button>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setAsking(true)}>
            Abonnement opzeggen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Account definitief wissen, bevestigd door de bedrijfsnaam over te typen. */
export function DeleteAccount({
  companyName,
  subscribed,
}: {
  companyName: string;
  subscribed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, action] = useActionState<DeleteAccountState, FormData>(deleteAccount, {});
  const matches = typed.trim().toLowerCase() === companyName.trim().toLowerCase();

  return (
    <Card className="mt-4 border-red-200">
      <CardHeader>
        <CardTitle>Account verwijderen</CardTitle>
        <CardDescription>
          Je bedrijf, alle aanvragen, foto&apos;s en instellingen worden definitief gewist. De
          widget op je website stopt meteen met werken. Dit kun je niet terugdraaien.
          {subscribed &&
            " Je abonnement stopt direct; de rest van je betaalde periode wordt niet terugbetaald."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {open ? (
          <form action={action} className="space-y-3">
            <label className="block text-sm">
              Typ <strong>{companyName}</strong> om te bevestigen
              <Input
                name="naam"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                className="mt-1.5 max-w-sm"
              />
            </label>
            {state.error && (
              <p className="flex items-center gap-2 text-sm text-red-700">
                <TriangleAlert className="size-4 shrink-0" />
                {state.error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Submit variant="destructive" disabled={!matches}>
                Account definitief verwijderen
              </Submit>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuleren
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" className="text-red-700" onClick={() => setOpen(true)}>
            Account verwijderen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
