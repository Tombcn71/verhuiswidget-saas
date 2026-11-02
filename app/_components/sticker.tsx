/**
 * Stickertekst bovenop een animatie, alleen voor de reels: zegt kort wat er nu gebeurt.
 * Plaats hem in een `relative pt-6` wrapper; bij een nieuwe tekst springt hij opnieuw in beeld.
 */
export function Sticker({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2">
      <span
        key={text}
        className="block -rotate-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-2xl font-extrabold whitespace-nowrap text-white shadow-xl ring-2 ring-white animate-in fade-in zoom-in-75 duration-300"
      >
        {text}
      </span>
    </span>
  );
}
