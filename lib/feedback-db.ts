import { neon } from "@neondatabase/serverless";

export type FeedbackRow = {
  id: number;
  user_email: string | null;
  categorie: string;
  bericht: string;
  mag_reageren: boolean;
  company_name: string | null;
  plan: string | null;
  pagina: string | null;
  created_at: string;
};

/** Alle feedback, nieuwste eerst (alleen server; zie /admin/feedback). */
export async function listFeedback(): Promise<FeedbackRow[]> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    return (await sql`SELECT * FROM feedback ORDER BY created_at DESC`) as FeedbackRow[];
  } catch {
    return []; // tabel bestaat pas na de eerste feedback
  }
}
