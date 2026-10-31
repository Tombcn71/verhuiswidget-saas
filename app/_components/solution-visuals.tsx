import { Camera, Sparkles } from "lucide-react";

/** Onspot: het startscherm van de scan op een telefoon: kamers scannen, dan de AI-analyse. */
export function SpotVisual() {
  return (
    <div className="relative mx-auto flex aspect-9/16 w-full max-w-[17rem] flex-col rounded-[2.75rem] border-[10px] border-slate-900 bg-white px-5 pt-10 pb-6 text-slate-900 shadow-xl dark:border-slate-700">
      {/* Camera-eiland */}
      <span className="absolute top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-slate-700" />
      <p className="text-center text-base font-bold">Foto&apos;s van de inboedel</p>
      <p className="mt-1 text-center text-xs text-slate-500">Kamer voor kamer, de AI doet de rest</p>
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-600 text-white">
          <Camera className="size-6" />
        </span>
        <span className="text-base font-semibold">Scan de kamers</span>
        <span className="text-xs leading-snug text-slate-500">
          Maak foto&apos;s terwijl je door het huis loopt
        </span>
      </div>
      <span className="mt-auto flex items-center justify-center gap-2 rounded-full bg-brand-600 py-3 text-sm font-semibold text-white">
        <Sparkles className="size-4" /> Start AI-analyse
      </span>
    </div>
  );
}
