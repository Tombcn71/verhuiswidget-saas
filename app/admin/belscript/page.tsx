import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { adminState, db } from "@/lib/db";
import { DEFAULT_SCRIPT, SCRIPT_KEY } from "./default-script";
import { ScriptEditor } from "./script-editor";

export const metadata: Metadata = { title: "Belscript" };

/** Belscript voor het werven van verhuisbedrijven; Tom kan het zelf aanpassen. */
export default async function CallScriptPage() {
  const [row] = await db.select().from(adminState).where(eq(adminState.key, SCRIPT_KEY)).limit(1);
  const saved = (row?.value as { text?: string } | undefined)?.text;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Belscript</h1>
      <ScriptEditor text={saved ?? DEFAULT_SCRIPT} isDefault={!saved} />
    </div>
  );
}
