// Feedback-categorieën zoals een verhuizer ze tegenkomt. De hulpvraag (placeholder)
// stuurt naar bruikbare feedback: welke offerte, wat had het moeten zijn.
// Gedeeld door de knop (client), de API en de admin-pagina.
export const CATEGORIEEN = [
  {
    value: "prijs",
    label: "Prijs klopt niet",
    vraag: "Welke offerte? Wat had de prijs moeten zijn, en waarom? (bijv. te weinig uren, km of toeslag)",
  },
  {
    value: "inventaris",
    label: "AI telt verkeerd",
    vraag: "Wat herkende de AI verkeerd? (bijv. 'kast als 2 kasten geteld', 'piano gemist', volume te hoog)",
  },
  {
    value: "bug",
    label: "Iets werkt niet",
    vraag: "Wat deed je en wat ging er mis? (bijv. 'widget laadt niet op mijn site', 'geen e-mail ontvangen')",
  },
  {
    value: "idee",
    label: "Idee of wens",
    vraag: "Wat zou je werk makkelijker maken? (bijv. een extra toeslag, koppeling met je planning)",
  },
  {
    value: "compliment",
    label: "Compliment",
    vraag: "Wat bevalt je aan moverAI?",
  },
] as const;

export type FeedbackCategorie = (typeof CATEGORIEEN)[number]["value"];

export function isFeedbackCategorie(value: unknown): value is FeedbackCategorie {
  return CATEGORIEEN.some((c) => c.value === value);
}

export function categorieLabel(value: string): string {
  return CATEGORIEEN.find((c) => c.value === value)?.label ?? value;
}
