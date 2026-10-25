import { NextResponse } from "next/server";
import { requireAdminCompany } from "@/lib/current-company";
import { extractTariffs } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
// Vercel accepteert max. ~4,5 MB per request.
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * Dashboard → Tarieven, "Snel instellen": de verhuizer uploadt een oude factuur
 * of offerte en krijgt de tarieven terug om het formulier mee te vullen.
 * Het bestand gaat alleen naar de AI en wordt nergens bewaard.
 */
export async function POST(request: Request) {
  await requireAdminCompany();

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) {
    return NextResponse.json({ error: "Kies een factuur of offerte." }, { status: 400 });
  }
  if (files.some((f) => !TYPES.includes(f.type))) {
    return NextResponse.json({ error: "Alleen pdf, jpg, png of webp." }, { status: 400 });
  }
  if (files.reduce((sum, f) => sum + f.size, 0) > MAX_BYTES) {
    return NextResponse.json({ error: "Samen maximaal 4 MB." }, { status: 400 });
  }

  try {
    const tariffs = await extractTariffs(
      await Promise.all(
        files.map(async (f) => ({
          data: Buffer.from(await f.arrayBuffer()).toString("base64"),
          mimeType: f.type,
        })),
      ),
    );
    return NextResponse.json({ tariffs });
  } catch (err) {
    console.error("Tarieven uit factuur lezen mislukt", err);
    return NextResponse.json(
      { error: "Lezen lukte niet. Probeer een duidelijkere pdf of foto." },
      { status: 500 },
    );
  }
}
