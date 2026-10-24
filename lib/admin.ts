import { notFound, redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

/** E-mailadressen met toegang tot /admin (moverAI zelf). Komma-gescheiden in env. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Alleen moverAI-beheerders (ADMIN_EMAILS). Niet ingelogd → inloggen; ingelogd
 * maar geen beheerder → 404, zodat de pagina voor anderen niet bestaat.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const { userId } = await auth();
  if (!userId) redirect("/inloggen?redirect_url=/admin");
  const user = await currentUser();
  const emails = (user?.emailAddresses ?? []).map((e) => e.emailAddress.toLowerCase());
  const allowed = adminEmails();
  const match = emails.find((e) => allowed.includes(e));
  if (!match) notFound();
  return { email: match };
}

/** Of de bezoeker een moverAI-beheerder is (zonder redirect), bijv. om eigen bezoeken niet te tellen. */
export async function isAdminViewer(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  const allowed = adminEmails();
  return (user?.emailAddresses ?? []).some((e) => allowed.includes(e.emailAddress.toLowerCase()));
}
