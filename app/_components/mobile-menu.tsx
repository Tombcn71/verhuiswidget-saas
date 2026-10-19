"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
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

/** Hamburgermenu voor de telefoon (shadcn Sheet); sluit bij elke keuze. */
export function MobileMenu({
  signedIn,
  links,
}: {
  signedIn: boolean;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  // Het paneel zet de pagina vast zolang het open is; daardoor scrolt een
  // #anker-link niet. Eerst sluiten, dan naar de sectie scrollen.
  const goTo = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      history.replaceState(null, "", href);
    }, 300);
  };

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
              <Button asChild size="lg" className="h-11">
                <a href="#prijzen" onClick={goTo("#prijzen")}>
                  Gratis starten
                </a>
              </Button>
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
