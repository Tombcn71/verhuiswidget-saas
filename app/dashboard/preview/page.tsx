import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../page-header";
import { requireCompany } from "@/lib/current-company";
import { appUrl } from "@/lib/app-url";

export const metadata: Metadata = { title: "Preview" };

export default async function PreviewPage() {
  const company = await requireCompany();
  const src = `${appUrl()}/widget/${company.id}?preview`;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Preview"
        description={
          <>
            Precies wat je klant ziet — maar met <strong>jouw tarieven</strong>. Loop de flow
            door en check of de offerteprijs klopt. In preview-modus wordt er geen lead
            opgeslagen en geen e-mail verstuurd.
          </>
        }
      />

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border bg-background shadow-lg">
        <iframe
          src={src}
          title="Widget-preview"
          allow="camera"
          className="h-[780px] w-full"
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Werkt de prijs niet zoals verwacht? Pas je{" "}
        <Link href="/dashboard/tarieven" className="text-primary underline">
          tarieven
        </Link>{" "}
        aan en herlaad deze pagina.
      </p>
    </div>
  );
}
