import type { Metadata } from "next";
import { UserButton } from "@clerk/nextjs";
import { requireAdmin } from "@/lib/admin";
import { Logo } from "@/app/_components/logo";
import { AdminNav } from "./admin-nav";
import { ThemeToggle } from "@/components/theme";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/** moverAI-beheer: verkoop-CRM, demo-leads en feedback. Alleen ADMIN_EMAILS. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="sticky top-0 z-20 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
          <Logo className="text-base" />
          <AdminNav />
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl p-4 md:p-8">{children}</main>
    </div>
  );
}
