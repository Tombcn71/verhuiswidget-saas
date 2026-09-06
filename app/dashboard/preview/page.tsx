import type { Metadata } from "next";
import { requireCompany } from "@/lib/current-company";

export const metadata: Metadata = { title: "Preview" };

export default async function PreviewPage() {
  const company = await requireCompany();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const src = `${appUrl}/widget/${company.id}?preview`;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Precies wat je klant ziet — maar met <strong>jouw tarieven</strong>. Loop de flow
          door en check of de offerteprijs klopt. In preview-modus wordt er geen lead
          opgeslagen en geen e-mail verstuurd.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        <iframe
          src={src}
          title="Widget-preview"
          className="h-[780px] w-full"
        />
      </div>

      <p className="text-center text-xs text-slate-400">
        Werkt de prijs niet zoals verwacht? Pas je{" "}
        <a href="/dashboard/tarieven" className="underline">
          tarieven
        </a>{" "}
        aan en herlaad deze pagina.
      </p>
    </div>
  );
}
