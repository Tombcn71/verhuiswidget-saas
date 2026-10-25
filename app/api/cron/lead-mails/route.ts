import { NextResponse } from "next/server";
import { sendDueFollowUps, sendDueReviewRequests } from "@/lib/lead-mails";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Dagelijks aangeroepen door Vercel Cron (zie vercel.json): offerte-opvolging en
 * reviewverzoeken. Vercel stuurt `Authorization: Bearer $CRON_SECRET` mee.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Niet toegestaan." }, { status: 401 });
  }

  const followUps = await sendDueFollowUps();
  const reviews = await sendDueReviewRequests();
  return NextResponse.json({ followUps, reviews });
}
