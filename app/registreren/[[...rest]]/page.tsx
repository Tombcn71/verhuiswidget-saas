import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/app/_components/logo";
import { PLANS, normalizePlan } from "@/lib/plans";

export const metadata: Metadata = { title: "Account aanmaken" };

export default async function SignUpPage({
  params,
  searchParams,
}: PageProps<"/registreren/[[...rest]]">) {
  const [{ rest }, query] = await Promise.all([params, searchParams]);

  // Uitgenodigde teamleden (`__clerk_ticket`) sluiten aan bij een bestaand bedrijf
  // en kiezen geen plan. Alle anderen beginnen bij de plankeuze. Sub-stappen van
  // Clerk (`/registreren/verify-…`) laten we met rust.
  const invited = typeof query.__clerk_ticket === "string";
  if (!rest && !invited && typeof query.plan !== "string") redirect("/#prijzen");

  const plan = typeof query.plan === "string" ? PLANS[normalizePlan(query.plan)] : null;
  const redirectUrl = plan ? `/kies-plan?plan=${plan.id}` : "/dashboard";

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      {plan && (
        <p className="mb-6 text-center text-sm text-slate-600">
          Je start met <strong>{plan.label}</strong>: 14 dagen gratis, geen betaalkaart
          nodig.
        </p>
      )}
      <SignUp forceRedirectUrl={redirectUrl} signInForceRedirectUrl={redirectUrl} />
    </div>
  );
}
