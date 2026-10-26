import { NextResponse } from "next/server";
import { sendDueFollowUps, sendDueReviewRequests } from "@/lib/lead-mails";
import { deleteExpiredPhotos } from "@/lib/photo-retention";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Dagelijks aangeroepen door Vercel Cron (zie vercel.json): offerte-opvolging,
 * reviewverzoeken en het opruimen van oude foto's. Vercel stuurt
 * `Authorization: Bearer $CRON_SECRET` mee. Foto's worden pas echt verwijderd
 * met `PHOTO_RETENTION=on`; anders wordt alleen geteld.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet toegestaan." }, { status: 401 });
  }

  const followUps = await sendDueFollowUps();
  const reviews = await sendDueReviewRequests();
  const photos = await deleteExpiredPhotos({ dryRun: process.env.PHOTO_RETENTION !== "on" });
  return NextResponse.json({ followUps, reviews, photos });
}
