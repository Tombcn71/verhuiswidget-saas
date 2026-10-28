/** Het korte bericht met het linkje (Jouw linkje en Snelle acties op het overzicht). */
export function linkMessage(link: string, company: string): string {
  return `Hoi! Bedankt voor je aanvraag. Via deze link scan je je kamers met je telefoon, en binnen een minuut heb je onze offerte in je mailbox: ${link}\n\nGroet, ${company}`;
}
