import Link from "next/link";
import { SOLUTIONS } from "./solutions";

/** Footer van de site, met de oplossingen en pakketten. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} moverAI · AI-offertes voor verhuizers</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {SOLUTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="hover:text-foreground">
              {s.name}
            </Link>
          ))}
          <Link href="/pakketten" className="hover:text-foreground">
            Pakketten
          </Link>
        </nav>
      </div>
    </footer>
  );
}
