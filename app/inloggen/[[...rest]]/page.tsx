import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/app/_components/logo";

export const metadata: Metadata = { title: "Inloggen" };

/**
 * Al ingelogd → meteen door (anders blijft Clerk's SignIn leeg). Paden staan
 * hier expliciet, zodat het niet afhangt van de NEXT_PUBLIC_CLERK_*-env.
 */
export default async function SignInPage({ searchParams }: PageProps<"/inloggen/[[...rest]]">) {
  const { redirect_url } = await searchParams;
  const next =
    typeof redirect_url === "string" && redirect_url.startsWith("/") ? redirect_url : "/dashboard";
  const { userId } = await auth();
  if (userId) redirect(next);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted px-6 py-16">
      <Link href="/" className="mb-8">
        <Logo />
      </Link>
      <SignIn path="/inloggen" signUpUrl="/#prijzen" fallbackRedirectUrl={next} />
    </div>
  );
}
