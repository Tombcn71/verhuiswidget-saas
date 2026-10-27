import Link from "next/link";
import { BellRing, Check, ClipboardList, MailCheck } from "lucide-react";
import { DEMO_COMPANY_PUBLIC } from "@/lib/demo";
import { markDemoLeadBooked } from "@/lib/demo-leads";
import { markDemoBooked } from "@/lib/prospects";
import { formatDate, formatEuroCents } from "@/lib/format";

/**
 * Boekingspagina voor een demo-offerte (/boeken/demo?n=…&b=…). Er is geen lead:
 * de gegevens komen uit de URL, er wordt niets opgeslagen of gemaild. Na
 * "Bevestig" volgt uitleg voor de bezoeker (een verhuizer) wat er in het echt gebeurt.
 */
export async function DemoBooking({
  query,
}: {
  query: Record<string, string | string[] | undefined>;
}) {
  const get = (k: string) => (typeof query[k] === "string" ? (query[k] as string) : "");
  const name = get("n").slice(0, 80) || "Jan";
  const totalCents = Number(get("b")) || 0;
  const moveDate = /^\d{4}-\d{2}-\d{2}$/.test(get("d")) ? get("d") : null;
  const what = get("s") === "ontruiming" ? "ontruiming" : "verhuizing";
  const confirmed = get("ok") === "1";
  const fromAddress = get("van").slice(0, 200);
  const toAddress = get("naar").slice(0, 200);
  const volume = Number(get("m3")) || 0;
  // Bevestigd vanuit de demo-mail: warmste signaal voor moverAI (alleen met toestemming).
  if (confirmed && get("dl")) await markDemoLeadBooked(get("dl"));
  if (confirmed && get("p")) await markDemoBooked(get("p"));
  const c = DEMO_COMPANY_PUBLIC;
  // Persoonlijke demolink: via /gesprek (klik vastleggen, opvolgmail schrappen).
  const calendlyUrl = process.env.CALENDLY_URL
    ? get("p")
      ? `/gesprek/${encodeURIComponent(get("p"))}`
      : process.env.CALENDLY_URL
    : null;

  return (
    <div
      className="flex min-h-dvh items-start justify-center bg-slate-50 px-4 py-10 sm:items-center"
      style={{ "--accent": c.primaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-center text-lg font-bold">{c.name}</p>
        <p className="mx-auto mt-2 w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          Demo · er wordt niets opgeslagen
        </p>

        {!confirmed ? (
          <>
            <h1 className="mt-6 text-center text-2xl font-bold tracking-tight">
              Je {what} boeken bij {c.name}
            </h1>
            <p className="mt-2 text-center text-slate-600">
              Controleer de gegevens en bevestig. {c.name} neemt daarna contact met je op om de
              details definitief te maken.
            </p>
            <dl className="mt-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Naam</dt>
                <dd className="text-right font-medium">{name}</dd>
              </div>
              {fromAddress && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">{toAddress ? "Van" : "Adres"}</dt>
                  <dd className="text-right font-medium">{fromAddress}</dd>
                </div>
              )}
              {toAddress && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Naar</dt>
                  <dd className="text-right font-medium">{toAddress}</dd>
                </div>
              )}
              {volume > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Volume</dt>
                  <dd className="font-medium">{volume.toLocaleString("nl-NL")} m³</dd>
                </div>
              )}
              {moveDate && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Voorkeursdatum</dt>
                  <dd className="font-medium">{formatDate(moveDate)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 text-base">
                <dt className="font-semibold">Prijsindicatie</dt>
                <dd className="font-bold">{formatEuroCents(totalCents)}</dd>
              </div>
              <p className="text-xs text-slate-500">
                Incl. btw. De definitieve prijs bevestigt {c.name} met je.
              </p>
            </dl>
            {/* Gewone GET: in de demo hoeft er niets te gebeuren behalve de uitleg. */}
            <form className="mt-6">
              {Object.entries({
                n: get("n"),
                b: get("b"),
                d: get("d"),
                s: get("s"),
                van: get("van"),
                naar: get("naar"),
                m3: get("m3"),
                dl: get("dl"),
                p: get("p"),
              }).map(
                ([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null),
              )}
              <input type="hidden" name="ok" value="1" />
              <button
                type="submit"
                className="w-full rounded-full bg-(--accent) px-6 py-3.5 font-semibold text-white shadow-md transition hover:brightness-95"
              >
                Bevestig mijn boeking
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mt-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="size-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Bedankt, {name}!</h1>
              <p className="mt-2 text-slate-600">Zo ziet je klant het. Dit gebeurt er in het echt:</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <BellRing className="mt-0.5 size-4 shrink-0 text-(--accent)" />
                <span>
                  <strong>Jij krijgt meteen een mail:</strong> &ldquo;{name} wil boeken (
                  {formatEuroCents(totalCents)})&rdquo;, met telefoonnummer en voorkeursdatum.
                </span>
              </li>
              <li className="flex gap-3">
                <ClipboardList className="mt-0.5 size-4 shrink-0 text-(--accent)" />
                <span>
                  <strong>In je dashboard</strong> staat de lead op &ldquo;klant akkoord&rdquo;, met
                  foto&apos;s, inventaris en prijsopbouw.
                </span>
              </li>
              <li className="flex gap-3">
                <MailCheck className="mt-0.5 size-4 shrink-0 text-(--accent)" />
                <span>
                  <strong>Je klant krijgt een bevestiging</strong> in jouw huisstijl, met jouw logo
                  en handtekening.
                </span>
              </li>
            </ul>
            <Link
              href="/kies-plan?plan=standard"
              className="mt-8 block rounded-full bg-(--accent) px-6 py-3.5 text-center font-semibold text-white shadow-md transition hover:brightness-95"
            >
              Probeer 14 dagen gratis
            </Link>
            {calendlyUrl && (
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener"
                className="mt-3 block rounded-full border border-slate-300 bg-white px-6 py-3.5 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Plan een adviesgesprek
              </a>
            )}
            <p className="mt-2 text-center text-xs text-slate-500">Geen betaalgegevens nodig</p>
          </>
        )}
      </div>
    </div>
  );
}
