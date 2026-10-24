import Link from "next/link";
import { Mail } from "lucide-react";
import { listFeedback } from "@/lib/feedback-db";
import { CATEGORIEEN, categorieLabel } from "@/lib/feedback";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Feedback die verhuizers via de knop in hun dashboard sturen. */
export default async function FeedbackPage({ searchParams }: PageProps<"/admin/feedback">) {
  const { cat } = await searchParams;
  const items = await listFeedback();
  const filter = typeof cat === "string" ? cat : "";
  const shown = filter ? items.filter((i) => i.categorie === filter) : items;
  const count = (c: string) => items.filter((i) => i.categorie === c).length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Feedback van verhuizers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {items.length} bericht{items.length !== 1 ? "en" : ""}
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Button asChild size="sm" variant={filter ? "outline" : "default"}>
          <Link href="/admin/feedback">Alles ({items.length})</Link>
        </Button>
        {CATEGORIEEN.map((c) => (
          <Button key={c.value} asChild size="sm" variant={filter === c.value ? "default" : "outline"}>
            <Link href={`/admin/feedback?cat=${c.value}`}>
              {c.label} ({count(c.value)})
            </Link>
          </Button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nog geen feedback in deze categorie.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{categorieLabel(item.categorie)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed">{item.bericht}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    {[item.company_name ?? "Onbekend bedrijf", item.plan, item.pagina, item.user_email]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {item.mag_reageren && item.user_email && (
                    <Button asChild size="sm" variant="secondary">
                      <a
                        href={`mailto:${item.user_email}?subject=${encodeURIComponent(
                          "Je feedback over moverAI",
                        )}&body=${encodeURIComponent(
                          `Hoi,\n\nBedankt voor je feedback!\n\n\n---\nJouw bericht:\n"${item.bericht}"`,
                        )}`}
                      >
                        <Mail /> Reageren
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
