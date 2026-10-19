import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLE: Record<string, string> = {
  nieuw: "bg-blue-50 text-blue-700 border-blue-200",
  gecontacteerd: "bg-amber-50 text-amber-800 border-amber-200",
  gewonnen: "bg-emerald-50 text-emerald-700 border-emerald-200",
  verloren: "bg-muted text-muted-foreground",
};

/** Status van een lead als gekleurd label. */
export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", STYLE[status])}>
      {status}
    </Badge>
  );
}
