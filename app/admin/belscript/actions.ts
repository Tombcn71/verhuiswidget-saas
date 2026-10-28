"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adminState, db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { SCRIPT_KEY } from "./default-script";

/** Slaat Toms eigen versie van het belscript op; lege tekst = terug naar de standaard. */
export async function saveCallScript(text: string): Promise<void> {
  await requireAdmin();
  if (!text.trim()) {
    await db.delete(adminState).where(eq(adminState.key, SCRIPT_KEY));
  } else {
    const value = { text: text.slice(0, 50000) };
    await db
      .insert(adminState)
      .values({ key: SCRIPT_KEY, value })
      .onConflictDoUpdate({ target: adminState.key, set: { value, updatedAt: new Date() } });
  }
  revalidatePath("/admin/belscript");
}
