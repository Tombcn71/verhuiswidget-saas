import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { neon } from "@neondatabase/serverless";
import { getCompanyByOrgId } from "@/lib/companies";
import { isFeedbackCategorie } from "@/lib/feedback";

async function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      categorie TEXT,
      bericht TEXT NOT NULL,
      mag_reageren BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS mag_reageren BOOLEAN DEFAULT FALSE`;
  // Context bij elk bericht: welk bedrijf, welk plan en vanaf welke pagina.
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS company_id UUID`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS company_name TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS plan TEXT`;
  await sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS pagina TEXT`;
  return sql;
}

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? null;
  const company = orgId ? await getCompanyByOrgId(orgId) : null;

  const { categorie, bericht, magReageren, pagina } = await req.json();
  if (typeof bericht !== "string" || !bericht.trim())
    return NextResponse.json({ error: "Bericht is leeg" }, { status: 400 });

  const sql = await getDb();
  await sql`
    INSERT INTO feedback (user_id, user_email, categorie, bericht, mag_reageren, company_id, company_name, plan, pagina)
    VALUES (
      ${userId},
      ${email},
      ${isFeedbackCategorie(categorie) ? categorie : "idee"},
      ${bericht.trim().slice(0, 5000)},
      ${!!magReageren},
      ${company?.id ?? null},
      ${company?.name ?? null},
      ${company?.plan ?? null},
      ${typeof pagina === "string" ? pagina.slice(0, 200) : null}
    )
  `;

  return NextResponse.json({ success: true });
}
