import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { CORS } from "@/lib/widget-request";

export const runtime = "nodejs";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Geeft een kortlevend upload-token uit zodat de browser de (verkleinde) foto's
 * rechtstreeks naar Vercel Blob stuurt — buiten de 4,5 MB serverless-limiet om.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 15 * 1024 * 1024,
        addRandomSuffix: true,
        validUntil: Date.now() + 10 * 60 * 1000,
      }),
      onUploadCompleted: async () => {
        // geen actie nodig — de URL's komen via de submit binnen
      },
    });
    return NextResponse.json(result, { headers: CORS });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload mislukt" },
      { status: 400, headers: CORS },
    );
  }
}
