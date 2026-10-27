import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/app/_components/logo";

export const metadata: Metadata = { title: "Inloggen" };

/**
 * Terugstuuradres van Clerk ("/admin" of "https://www.moverai.nl/admin") als
 * eigen pad; nooit een ander domein (open redirect).
 */
function safePath(value: string | string[] | undefined): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "moverai.nl" || url.hostname.endsWith(".moverai.nl")) {
      return url.pathname + url.search;
    }
  } catch {}
  return null;
}

/**
 * Al ingelogd → meteen door (anders blijft Clerk's SignIn leeg). Paden staan
 * hier expliciet, zodat het niet afhangt van de NEXT_PUBLIC_CLERK_*-env.
 */
export default async function SignInPage({ searchParams }: PageProps<"/inloggen/[[...rest]]">) {
  const { redirect_url } = await searchParams;
  const next = safePath(redirect_url) ?? "/dashboard";
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
