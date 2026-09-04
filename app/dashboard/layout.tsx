import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { getOrCreateCompany, normalizeServiceType } from "@/lib/companies";
import { Logo } from "@/app/_components/logo";
import { DashboardNav } from "./nav";

const PLAN_LABEL = {
  verhuizen: "Plan Verhuizen",
  ontruimen: "Plan Ontruimen",
  beide: "Plan Verhuizen + Ontruimen",
} as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/inloggen");

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "onbekend@example.com";
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

  const company = await getOrCreateCompany({ clerkUserId: userId, email, name });

  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Logo className="text-base" />
            <span className="hidden rounded-full border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-500 sm:inline">
              {PLAN_LABEL[normalizeServiceType(company.serviceType)]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">{company.name}</span>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-8 md:flex-row">
        <DashboardNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
