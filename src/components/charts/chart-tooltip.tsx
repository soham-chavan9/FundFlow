"use client";

/**
 * Tooltip body for the money charts: the period, then one row per series with
 * its colour key, name and exact amount. Text stays in text colours; only the
 * small key carries the series colour.
 */
export function MoneyTooltip({
  active,
  payload,
  label,
  format,
  names,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{
    dataKey?: unknown;
    value?: unknown;
    color?: string;
    fill?: string;
    payload?: { fullLabel?: string };
  }>;
  label?: unknown;
  format: (cents: number) => string;
  /** Display name per data key. */
  names: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground grid min-w-36 gap-1.5 rounded-lg border px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
      <p className="font-medium">{payload[0]?.payload?.fullLabel ?? String(label ?? "")}</p>
      {payload.map((item) => {
        const key = String(item.dataKey ?? "");
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color ?? item.fill }}
            />
            <span className="text-muted-foreground">{names[key] ?? key}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">
              {format(Number(item.value ?? 0))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
