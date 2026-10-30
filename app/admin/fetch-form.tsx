"use client";

import { useActionState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProspectsAction, type FetchState } from "./actions";

const initial: FetchState = { status: "idle" };

/** Dagelijks nieuwe verhuisbedrijven ophalen via Google Places. */
export function FetchForm({ nextCity }: { nextCity: string | null }) {
  const [state, action, pending] = useActionState(fetchProspectsAction, initial);
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Input name="city" placeholder={nextCity ? `Plaats (leeg = ${nextCity} en verder)` : "Plaats"} className="min-w-48 flex-1" />
        <select name="count" defaultValue="20" aria-label="Aantal" className="h-8 rounded-md border bg-background px-2 text-sm">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="40">40</option>
        </select>
        <Button type="submit" disabled={pending}>
          <MapPin /> {pending ? "Zoeken…" : "Haal nieuwe"}
        </Button>
      </div>
      {state.message && (
        <p className={state.status === "error" ? "text-sm text-destructive" : "text-sm text-emerald-600"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
