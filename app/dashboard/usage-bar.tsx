import type { ScanUsage } from "@/lib/plans";

/** "123 / 150" met een balk; oranje vanaf 80%, rood boven de limiet. */
export function UsageBar({ usage, className = "" }: { usage: ScanUsage; className?: string }) {
  if (usage.limit === null) {
    return (
      <div className={className}>
        <div className="text-2xl font-bold">{usage.used}</div>
        <div className="text-xs text-muted-foreground">Onbeperkt</div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((usage.ratio ?? 0) * 100));
  const color = usage.over ? "bg-red-500" : usage.nearLimit ? "bg-amber-500" : "bg-primary";

  return (
    <div className={className}>
      <div className="text-2xl font-bold">
        {usage.used} <span className="text-base font-normal text-muted-foreground">/ {usage.limit}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
