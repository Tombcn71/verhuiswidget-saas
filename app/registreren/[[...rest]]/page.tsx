import type { Metadata } from "next";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/app/_components/logo";
import { normalizeServiceType } from "@/lib/companies";

export const metadata: Metadata = { title: "Account aanmaken" };

export default async function SignUpPage({
  searchParams,
}: PageProps<"/registreren/[[...rest]]">) {
  const { dienst } = await searchParams;
  // Na registratie langs /kies-plan zodat de dienstkeuze op het bedrijf komt.
  const redirectUrl =
    typeof dienst === "string"
      ? `/kies-plan?dienst=${normalizeServiceType(dienst)}`
      : "/dashboard";

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <SignUp forceRedirectUrl={redirectUrl} signInForceRedirectUrl={redirectUrl} />
    </div>
  );
}
