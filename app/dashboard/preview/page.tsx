import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../page-header";
import { requireCompany } from "@/lib/current-company";
import { appUrl } from "@/lib/app-url";

export const metadata: Metadata = { title: "Test je tarieven" };

/**
 * Bereikbaar via Tarieven → "Test je tarieven". De widget in preview-modus met
 * voorbeeldwoningen (zie app/widget/[companyId]/sample-homes.ts).
 */
export default async function PreviewPage() {
  const company = await requireCompany();
  const src = `${appUrl()}/widget/${company.id}?preview`;

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/tarieven" className="text-sm text-muted-foreground hover:text-foreground">
        ‹ Terug naar tarieven
      </Link>
      <PageHeader
        title="Test je tarieven"
        description={
          <>
            Precies wat je klant ziet, met <strong>jouw tarieven</strong>. Kies een voorbeeldwoning
            en check of de offerteprijs klopt. Er wordt geen aanvraag opgeslagen en geen e-mail
            verstuurd.
          </>
        }
      />

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-lg">
        <iframe
          src={src}
          title="Test je tarieven"
          allow="camera"
          className="h-[780px] w-full"
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Klopt de prijs niet? Pas je{" "}
        <Link href="/dashboard/tarieven" className="text-primary underline">
          tarieven
        </Link>{" "}
        aan en test opnieuw. Komt het niet goed? Laat het ons weten via Feedback aan de zijkant.
      </p>
    </div>
  );
}
