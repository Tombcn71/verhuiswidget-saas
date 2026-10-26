import { appIconResponse } from "@/app/_components/app-icon";

const SIZES = [192, 512];

/** Iconen voor de web-app-manifest (/app-icon/192 en /app-icon/512). */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.includes(size)) return new Response("Niet gevonden", { status: 404 });
  return appIconResponse(size);
}
