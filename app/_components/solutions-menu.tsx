"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SOLUTIONS } from "./solutions";

/** Desktopmenu "Oplossingen": Onlink, Onsite, Onspot en Pakketten. */
export function SolutionsMenu() {
  const [open, setOpen] = useState(false);
  const items = [...SOLUTIONS, { href: "/pakketten", name: "Pakketten", sub: "Basic, Pro of Op maat", Icon: Tag }];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost">
          Oplossingen <ChevronDown className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 gap-1 p-2">
        {items.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            onClick={() => setOpen(false)}
            className="flex items-start gap-3 rounded-md p-2.5 hover:bg-muted"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <s.Icon className="size-4.5" />
            </span>
            <span>
              <span className="block font-semibold">{s.name}</span>
              <span className="block text-muted-foreground">{s.sub}</span>
            </span>
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}
