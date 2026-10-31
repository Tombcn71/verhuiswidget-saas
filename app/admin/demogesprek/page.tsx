import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { adminState, db } from "@/lib/db";
import { DEFAULT_DEMO_SCRIPT, DEMO_SCRIPT_KEY } from "../belscript/default-script";
import { ScriptEditor } from "../belscript/script-editor";

export const metadata: Metadata = { title: "Demogesprek" };

/** Script voor het demogesprek via WhatsApp-bellen; Tom kan het zelf aanpassen. */
export default async function DemoCallScriptPage() {
  const [row] = await db.select().from(adminState).where(eq(adminState.key, DEMO_SCRIPT_KEY)).limit(1);
  const saved = (row?.value as { text?: string } | undefined)?.text;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Demogesprek</h1>
      <ScriptEditor text={saved ?? DEFAULT_DEMO_SCRIPT} isDefault={!saved} scriptKey={DEMO_SCRIPT_KEY} />
    </div>
  );
}
