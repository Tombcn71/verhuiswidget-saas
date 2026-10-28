"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Link2,
  ScanLine,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Logo, LogoMark } from "@/app/_components/logo";

type Item = { href: string; label: string; icon: LucideIcon; adminOnly?: boolean };

// `adminOnly`: alleen zichtbaar voor org-admins (de pagina's zelf checken dit ook).
const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Werk",
    items: [
      { href: "/dashboard", label: "Overzicht", icon: LayoutDashboard },
      { href: "/dashboard/leads", label: "Leads", icon: Inbox },
      { href: "/dashboard/scan", label: "Scannen", icon: ScanLine },
    ],
  },
  {
    label: "Instellen",
    items: [
      { href: "/dashboard/tarieven", label: "Tarieven", icon: Calculator, adminOnly: true },
      { href: "/dashboard/instellingen", label: "Bedrijf", icon: Building2, adminOnly: true },
      { href: "/dashboard/embed", label: "Jouw linkje", icon: Link2 },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/team", label: "Team", icon: Users },
      { href: "/dashboard/abonnement", label: "Abonnement", icon: CreditCard, adminOnly: true },
    ],
  },
];

export function AppSidebar({
  admin,
  planLabel,
  trialDaysLeft,
  trialExpired,
}: {
  admin: boolean;
  planLabel: string;
  /** Resterende proefdagen, of null als er betaald wordt of de proef voorbij is. */
  trialDaysLeft: number | null;
  /** Proef voorbij en (nog) niet betaald. */
  trialExpired: boolean;
}) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex h-10 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="group-data-[collapsible=icon]:hidden">
            <Logo className="text-base" />
          </span>
          <LogoMark className="hidden h-6 w-6 text-primary group-data-[collapsible=icon]:block" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {GROUPS.map((group) => {
          const items = group.items.filter((i) => admin || !i.adminOnly);
          if (items.length === 0) return null;
          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href} onClick={() => setOpenMobile(false)}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs">
          <Badge variant="secondary">{planLabel}</Badge>
          <span className="text-muted-foreground">
            {trialExpired
              ? "Proef verlopen"
              : trialDaysLeft !== null
                ? `Proef: nog ${trialDaysLeft} ${trialDaysLeft === 1 ? "dag" : "dagen"}`
                : "Actief"}
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
