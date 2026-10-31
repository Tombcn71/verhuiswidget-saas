"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/app/_components/logo";
import { SOLUTIONS } from "./solutions";
import { PlanDemoButton } from "./plan-demo-button";

/** Hamburgermenu voor de telefoon (shadcn Sheet); sluit bij elke keuze. */
export function MobileMenu({
  signedIn,
  links,
  calendlyUrl,
}: {
  signedIn: boolean;
  links: { href: string; label: string }[];
  calendlyUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Het paneel zet de pagina vast zolang het open is; daardoor scrolt een
  // #anker-link niet. Op de homepage: eerst sluiten, dan naar de sectie scrollen.
  const goTo = (href: string) => (e: React.MouseEvent) => {
    const hash = href.slice(href.indexOf("#"));
    if (pathname !== "/") return setOpen(false);
    e.preventDefault();
    setOpen(false);
    setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", hash);
    }, 300);
  };

  const solutions = [...SOLUTIONS, { href: "/pakketten", name: "Pakketten", sub: "Basic, Pro, Op maat", Icon: Tag }];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="md:hidden" aria-label="Menu openen">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo className="text-base" />
          </SheetTitle>
          <SheetDescription className="sr-only">Navigatie</SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4">
          <p className="px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Oplossingen
          </p>
          {solutions.map((s) => (
            <SheetClose key={s.href} asChild>
              <Link href={s.href} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted">
                <s.Icon className="size-4 text-brand-600" />
                <span className="text-base font-medium">{s.name}</span>
                <span className="text-sm text-muted-foreground">{s.sub}</span>
              </Link>
            </SheetClose>
          ))}
          <Separator className="my-2" />
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={goTo(l.href)}
              className="rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <Separator className="mx-4 w-auto" />

        <div className="flex flex-col gap-2 px-4">
          {signedIn ? (
            <SheetClose asChild>
              <Button asChild size="lg" className="h-11">
                <Link href="/dashboard">Naar dashboard</Link>
              </Button>
            </SheetClose>
          ) : (
            <>
              <PlanDemoButton href={calendlyUrl} from="mobiel menu" />
              <SheetClose asChild>
                <Button asChild variant="outline" size="lg" className="h-11">
                  <Link href="/inloggen">Inloggen</Link>
                </Button>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
