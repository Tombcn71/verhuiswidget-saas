"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/tarieven", label: "Tarieven" },
  { href: "/dashboard/instellingen", label: "Bedrijf" },
  { href: "/dashboard/embed", label: "Widget-link" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="md:w-56 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
