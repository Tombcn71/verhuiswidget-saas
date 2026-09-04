# VerhuisWidget SaaS

White-label verhuis- en ontruimingswidget voor verhuisbedrijven. Klanten uploaden foto's
van hun kamers, Google Gemini herkent de meubels en berekent automatisch een offerteprijs
op basis van de tarieven van de betreffende verhuizer. De aanvraag komt binnen als lead en
er gaan direct twee offerte-e-mails uit (klant + verhuizer).

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind CSS v4**
- **Clerk** — authenticatie (`proxy.ts` beschermt `/dashboard`)
- **Neon** (PostgreSQL) via **Drizzle ORM** (`drizzle-orm/neon-http`)
- **Google Gemini** (`@google/genai`) — foto-analyse
- **Resend** — offerte-e-mails

## Aan de slag

1. **Environment variabelen** — kopieer `.env.example` naar `.env.local` en vul in:
   - `DATABASE_URL` — Neon connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
   - `GEMINI_API_KEY`
   - `RESEND_API_KEY` / `QUOTE_FROM_EMAIL` (geverifieerd afzenderdomein)
   - `NEXT_PUBLIC_APP_URL` — publieke URL van de app (voor de embed-code en e-mails)

2. **Database migreren**

   ```bash
   pnpm db:generate   # genereert SQL uit lib/db/schema.ts (al gedaan)
   pnpm db:migrate    # voert migraties uit op Neon
   # of tijdens ontwikkeling:
   pnpm db:push
   ```

3. **Ontwikkelserver**

   ```bash
   pnpm dev
   ```

## Structuur

| Pad | Doel |
| --- | --- |
| `app/page.tsx` | Publieke SaaS-homepage |
| `app/inloggen`, `app/registreren` | Clerk auth-pagina's |
| `app/dashboard` | Beveiligd dashboard (overzicht, leads, instellingen, widget-code) |
| `app/widget/[companyId]` | Publieke multi-step widget (wordt in een iframe geladen) |
| `app/api/widget/submit` | Route handler: Gemini-analyse → prijs → lead opslaan → e-mails |
| `public/embed.js` | Loader-script dat de widget als responsive iframe injecteert |
| `lib/db` | Drizzle-schema en client |
| `lib/gemini.ts` | Foto-analyse en inventarisschema |
| `lib/pricing.ts` | Prijsberekening op basis van verhuizer-tarieven |
| `lib/email.ts` | Offerte-e-mails (klant + verhuizer) |

## Widget plaatsen

In het dashboard onder **Widget-code** staat per verhuizer:

```html
<script src="https://JOUW-APP-URL/embed.js" data-company-id="<uuid>" async></script>
```

De widget haalt automatisch de tarieven en huisstijl van die verhuizer op.
