"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveCallScript } from "./actions";

type Section = { title: string | null; lines: string[] };

/** Tekst → blokken: elke "# " begint een nieuw blok. */
function sections(text: string): Section[] {
  const out: Section[] = [{ title: null, lines: [] }];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("# ")) out.push({ title: line.slice(2), lines: [] });
    else if (line) out[out.length - 1].lines.push(line);
  }
  return out.filter((s) => s.title || s.lines.length);
}

function Line({ line }: { line: string }) {
  // "vraag | antwoord" (bezwaren)
  const bar = line.indexOf(" | ");
  if (bar > 0) {
    return (
      <div className="grid gap-1 border-t py-3 first:border-t-0 sm:grid-cols-[14rem_1fr] sm:gap-4">
        <p className="font-medium">{line.slice(0, bar)}</p>
        <p className="text-muted-foreground">{line.slice(bar + 3)}</p>
      </div>
    );
  }
  // "1. Titel: tekst" (stappen); korte titel vet
  const step = line.match(/^(\d+)\.\s+(.*)$/);
  if (step) {
    const colon = step[2].indexOf(": ");
    const hasTitle = colon > 0 && colon < 50;
    return (
      <div className="flex gap-3 py-1.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {step[1]}
        </span>
        <p className="pt-1">
          {hasTitle ? (
            <>
              <span className="font-semibold">{step[2].slice(0, colon)}</span>
              <span className="block text-muted-foreground">{step[2].slice(colon + 2)}</span>
            </>
          ) : (
            step[2]
          )}
        </p>
      </div>
    );
  }
  if (line.startsWith("- ")) {
    return <p className="relative py-0.5 pl-5 before:absolute before:left-1 before:content-['•']">{line.slice(2)}</p>;
  }
  return <p className="py-1 text-muted-foreground">{line}</p>;
}

/** Belscript tonen, en met Bewerken zelf aanpassen (opgeslagen in de database). */
export function ScriptEditor({ text, isDefault }: { text: string; isDefault: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [pending, startTransition] = useTransition();

  const save = (value: string) =>
    startTransition(async () => {
      await saveCallScript(value);
      setEditing(false);
    });

  if (editing) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Opmaak: <code># </code> voor een kop, <code>- </code> voor een opsomming,{" "}
          <code>1. Titel: tekst</code> voor een stap en <code>vraag | antwoord</code> voor een
          bezwaar.
        </p>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[70vh] font-mono text-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save(draft)} disabled={pending}>
            {pending ? "Opslaan…" : "Opslaan"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setDraft(text);
              setEditing(false);
            }}
          >
            Annuleren
          </Button>
          {!isDefault && (
            <Button
              variant="ghost"
              className="ml-auto text-muted-foreground"
              disabled={pending}
              onClick={() => {
                if (confirm("Je eigen versie wissen en terug naar het standaard belscript?")) save("");
              }}
            >
              Terug naar standaard
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDraft(text);
            setEditing(true);
          }}
        >
          <Pencil /> Bewerken
        </Button>
      </div>
      {sections(text).map((s, i) =>
        s.title ? (
          <Card key={i}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {s.lines.map((l, j) => (
                <Line key={j} line={l} />
              ))}
            </CardContent>
          </Card>
        ) : (
          <div key={i} className="text-sm">
            {s.lines.map((l, j) => (
              <Line key={j} line={l} />
            ))}
          </div>
        ),
      )}
    </div>
  );
}
