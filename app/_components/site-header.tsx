import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/app/_components/logo";
import { MobileMenu } from "./mobile-menu";
import { SolutionsMenu } from "./solutions-menu";
import { PlanDemoButton } from "./plan-demo-button";
import { ThemeToggle } from "@/components/theme";

/** Secties op de homepage; met "/" ervoor, zodat ze ook vanaf de andere pagina's werken. */
export const NAV_LINKS = [
  { href: "/#voordelen", label: "Voordelen" },
  { href: "/#faq", label: "FAQ" },
];

/**
 * Navigatie van de site (shadcn). Desktop: Oplossingen en links in het midden,
 * "Plan een demo" rechts. Telefoon: hamburger met uitschuifpaneel (Sheet).
 */
export async function SiteHeader() {
  const { userId } = await auth();
  const signedIn = !!userId;
  const calendlyUrl = process.env.CALENDLY_URL ?? null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/75">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" aria-label="moverAI, naar de homepage">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <SolutionsMenu />
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
              <PlanDemoButton href={calendlyUrl} from="header" className="px-4 py-2 text-sm" />
            </>
          )}
        </div>

        <div className="flex items-center md:hidden">
          <ThemeToggle />
          <MobileMenu signedIn={signedIn} links={NAV_LINKS} calendlyUrl={calendlyUrl} />
        </div>
      </div>
    </header>
  );
}
