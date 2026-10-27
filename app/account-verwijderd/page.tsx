import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { Logo } from "@/app/_components/logo";

export const metadata: Metadata = { title: "Account verwijderd" };

/** Landt hier na "Account verwijderen" op de Abonnement-pagina. */
export default function AccountDeletedPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <CircleCheck className="mx-auto size-10 text-emerald-600" />
        <h1 className="mt-4 text-xl font-semibold">Je account is verwijderd</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Je bedrijf, aanvragen, foto&apos;s en instellingen zijn gewist en je abonnement is
          gestopt. Je betaalt niets meer.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Bedankt dat je moverAI hebt geprobeerd.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary underline">
          Naar de homepage
        </Link>
      </div>
    </div>
  );
}
