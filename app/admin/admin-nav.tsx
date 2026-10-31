"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "CRM" },
  { href: "/admin/demo-leads", label: "Demo-leads" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/belscript", label: "Belscript" },
  { href: "/admin/demogesprek", label: "Demogesprek" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 text-sm font-medium">
      {ITEMS.map((i) => {
        const active =
          i.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/prospects")
            : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={cn(
              "rounded-full px-3 py-1.5 transition",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
