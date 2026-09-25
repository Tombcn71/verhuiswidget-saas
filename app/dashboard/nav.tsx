"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// `adminOnly`: alleen zichtbaar voor org-admins (de pagina's zelf checken dit ook).
const items = [
  { href: "/dashboard", label: "Overzicht" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/scan", label: "Scannen" },
  { href: "/dashboard/tarieven", label: "Tarieven", adminOnly: true },
  { href: "/dashboard/preview", label: "Preview" },
  { href: "/dashboard/instellingen", label: "Bedrijf", adminOnly: true },
  { href: "/dashboard/embed", label: "Widget-link" },
  { href: "/dashboard/team", label: "Team" },
  { href: "/dashboard/abonnement", label: "Abonnement", adminOnly: true },
];

export function DashboardNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="md:w-56 md:shrink-0">
      <ul className="flex gap-1 overflow-x-auto md:flex-col">
        {items.filter((item) => admin || !item.adminOnly).map((item) => {
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
