import { Resend } from "resend";

type SendPayload = Parameters<Resend["emails"]["send"]>[0];

/**
 * Platte-tekstversie van een HTML-mail. Mails met alleen HTML scoren slechter
 * bij spamfilters (o.a. iCloud en Gmail), dus elke mail krijgt er een mee.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, label: string) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return href.startsWith("mailto:") || text === href ? text : `${text} (${href})`;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr|li|table)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Afzender met een eigen adres per naam. Eén adres met wisselende namen ("Jansen
 * Verhuizingen" en vlak daarna "moverAI") lijkt op vervalsing en gaat de spam in.
 * - offerte@… (QUOTE_FROM_EMAIL): mails aan klanten, op naam van de verhuizer
 * - aanvragen@…: mails van moverAI aan verhuizers en meldingen aan moverAI
 * - tom@…: persoonlijke mails uit de verkoop-CRM ("Tom van moverAI")
 * - demo-offerte@ / demo-aanvraag@: de twee demo-mails, zodat de bezoeker in zijn
 *   inbox meteen ziet welke de klant krijgt en welke hijzelf
 */
export function sender(
  name: string,
  local: "aanvragen" | "tom" | "demo-offerte" | "demo-aanvraag",
): string | null {
  const quoteFrom = process.env.QUOTE_FROM_EMAIL;
  const domain = quoteFrom?.split("@")[1];
  return domain ? `${name} <${local}@${domain}>` : null;
}

/** Resend, maar met automatisch een platte-tekstversie naast de HTML. */
export function mailer(apiKey: string) {
  const resend = new Resend(apiKey);
  return {
    emails: {
      send: (payload: SendPayload) =>
        resend.emails.send(
          payload.html && !payload.text ? { ...payload, text: htmlToText(payload.html) } : payload,
        ),
      cancel: (id: string) => resend.emails.cancel(id),
    },
  };
}
