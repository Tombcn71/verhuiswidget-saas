"use client";

import { useActionState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkSitesAction, type FetchState } from "./actions";

const initial: FetchState = { status: "idle" };

/** Bestaande bedrijven alsnog op WhatsApp controleren (per klik een deel). */
export function CheckSitesButton({ remaining }: { remaining: number }) {
  const [state, action, pending] = useActionState(checkSitesAction, initial);
  if (remaining === 0 && state.status === "idle") return null;
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
      <Button type="submit" variant="outline" disabled={pending}>
        <MessageCircle /> {pending ? "Websites bekijken…" : "Check websites op WhatsApp"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {state.message ?? `${remaining} bedrijven in je lijst zijn nog niet bekeken.`}
      </span>
    </form>
  );
}
