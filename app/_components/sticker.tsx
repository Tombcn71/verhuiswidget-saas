/**
 * Stickertekst bovenop een animatie (zoals in een reel): zegt kort wat er nu gebeurt.
 * Plaats hem in een `relative pt-5` wrapper; bij een nieuwe tekst springt hij opnieuw in beeld.
 */
export function Sticker({ text }: { text: string }) {
  return (
    <span className="pointer-events-none absolute top-0 left-1/2 z-30 -translate-x-1/2">
      <span
        key={text}
        className="block -rotate-2 rounded-xl bg-white px-3 py-1.5 text-sm font-bold whitespace-nowrap text-slate-900 shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-75 duration-300"
      >
        {text}
      </span>
    </span>
  );
}
