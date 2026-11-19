import { cn } from "cn";
import type { BudgetPace } from "@/lib/finance";

/**
 * Spend against a monthly limit. The fill is neutral while on track, amber
 * when ahead of pace and red once over. The signature pace line, a hairline in
 * the accent colour, marks how far through the month today is; spending to the
 * left of it is on pace.
 */
export function BudgetPaceBar({
  pace,
  label,
  className,
}: {
  pace: BudgetPace;
  /** Screen-reader text, e.g. "Food: $120 of $300, ahead of pace". */
  label: string;
  className?: string;
}) {
  const fill = Math.min(1, Math.max(0, pace.ratio));
  const showPaceLine = pace.paceRatio > 0 && pace.paceRatio < 1;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={pace.limitCents}
      aria-valuenow={Math.min(pace.spentCents, pace.limitCents)}
      aria-valuetext={label}
      className={cn("relative h-2 w-full", className)}
    >
      <div className="bg-muted absolute inset-0 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
            pace.state === "onTrack" && "bg-foreground/75",
            pace.state === "ahead" && "bg-warning",
            pace.state === "over" && "bg-destructive",
          )}
          style={{ width: `${fill * 100}%` }}
        />
      </div>
      {showPaceLine ? (
        <div
          aria-hidden
          className="bg-pace ring-background absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full ring-2"
          style={{ left: `${pace.paceRatio * 100}%` }}
        />
      ) : null}
    </div>
  );
}
