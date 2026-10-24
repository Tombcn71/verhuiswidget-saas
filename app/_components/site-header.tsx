import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/_components/logo";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "@/components/theme";

/** Ankers op de homepage; gedeeld met het mobiele menu. */
export const NAV_LINKS = [
  { href: "#voordelen", label: "Voordelen" },
  { href: "#hoe-het-werkt", label: "Hoe het werkt" },
  { href: "#prijzen", label: "Prijzen" },
];

/**
 * Navigatie van de homepage (shadcn). Desktop: links in het midden, knoppen
 * rechts. Telefoon: hamburger met uitschuifpaneel (Sheet).
 */
export async function SiteHeader() {
  const { userId } = await auth();
  const signedIn = !!userId;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="moverAI, naar de homepage">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            // Gewone <a>: Next-links scrollen niet opnieuw als de hash al in de URL staat.
            <Button key={l.href} asChild variant="ghost">
              <a href={l.href}>{l.label}</a>
            </Button>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {signedIn ? (
            <Button asChild size="lg">
              <Link href="/dashboard">Naar dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="lg">
                <Link href="/inloggen">Inloggen</Link>
              </Button>
              <Button asChild size="lg">
                <a href="#prijzen">Gratis starten</a>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <MobileMenu signedIn={signedIn} links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
