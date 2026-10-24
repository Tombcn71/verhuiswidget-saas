import { Badge } from "@/components/ui/badge";
import { stageLabel } from "@/lib/prospects";
import { cn } from "@/lib/utils";

const STAGE_STYLE: Record<string, string> = {
  nieuw: "bg-muted text-muted-foreground",
  gebeld: "bg-sky-50 text-sky-700 border-sky-200",
  demo_gestuurd: "bg-blue-50 text-blue-700 border-blue-200",
  demo_gedaan: "bg-violet-50 text-violet-700 border-violet-200",
  proef: "bg-amber-50 text-amber-800 border-amber-200",
  klant: "bg-emerald-50 text-emerald-700 border-emerald-200",
  afgevallen: "bg-muted text-muted-foreground line-through",
};

/** Fase in de verkoop-pijplijn als gekleurd label. */
export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge variant="outline" className={cn("whitespace-nowrap", STAGE_STYLE[stage])}>
      {stageLabel(stage)}
    </Badge>
  );
}

