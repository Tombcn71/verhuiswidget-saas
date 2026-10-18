import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { requireAdminCompany } from "@/lib/current-company";

export const runtime = "nodejs";

/**
 * Upload-token voor het bedrijfslogo (Dashboard → Bedrijf). De browser stuurt
 * het bestand rechtstreeks naar Vercel Blob; alleen admins krijgen een token.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const company = await requireAdminCompany();
        return {
          // Geen SVG: veel e-mailprogramma's tonen die niet in de offerte-mail.
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp"],
          maximumSizeInBytes: 2 * 1024 * 1024,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: company.id,
        };
      },
      onUploadCompleted: async () => {
        // geen actie nodig — de URL wordt opgeslagen met het formulier
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload mislukt" },
      { status: 400 },
    );
  }
}
