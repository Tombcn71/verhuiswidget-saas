"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminState, db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { DEFAULT_DEMO_SCRIPT, DEFAULT_SCRIPT, DEMO_SCRIPT_KEY, SCRIPT_KEY } from "./default-script";

const DEFAULTS: Record<string, { text: string; path: string }> = {
  [SCRIPT_KEY]: { text: DEFAULT_SCRIPT, path: "/admin/belscript" },
  [DEMO_SCRIPT_KEY]: { text: DEFAULT_DEMO_SCRIPT, path: "/admin/demogesprek" },
};

/**
 * Slaat Toms eigen versie van het belscript of het demogesprek op. Leeg of
 * ongewijzigd = de standaard (dan geen kopie, zodat latere verbeteringen aan de
 * standaard zichtbaar blijven).
 */
export async function saveCallScript(text: string, key: string = SCRIPT_KEY): Promise<void> {
  await requireAdmin();
  const def = DEFAULTS[key];
  if (!def) throw new Error("Onbekend script.");
  if (!text.trim() || text.trim() === def.text.trim()) {
    await db.delete(adminState).where(eq(adminState.key, key));
  } else {
    const value = { text: text.slice(0, 50000) };
    await db
      .insert(adminState)
      .values({ key, value })
      .onConflictDoUpdate({ target: adminState.key, set: { value, updatedAt: new Date() } });
  }
  revalidatePath(def.path);
}
