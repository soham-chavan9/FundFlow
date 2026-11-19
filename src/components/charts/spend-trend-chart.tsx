"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Tooltip, XAxis, YAxis } from "recharts";
import { formatAxisMoney } from "@/lib/format";
import { formatMoney, type Currency } from "@/lib/money";
import { ChartContainer } from "@/components/ui/chart";
import { MoneyTooltip } from "./chart-tooltip";

export interface TrendPoint {
  month: string;
  /** Short axis label, e.g. "Nov". */
  label: string;
  /** Full label for the tooltip, e.g. "November 2026". */
  fullLabel: string;
  cents: number;
  /** Where a click on this month's column goes. Without one the chart is static. */
  href?: string;
}

/**
 * Monthly spend as columns. Emphasis form: the month being viewed is in the
 * accent and carries the only value label; the other months are context in
 * gray. Clicking a column opens that month.
 */
export function SpendTrendChart({
  data,
  selected,
  currency,
  seriesName,
  label,
}: {
  data: TrendPoint[];
  selected: string;
  currency: Currency;
  seriesName: string;
  /** Accessible name of the figure; the page also renders the data as a table. */
  label: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const max = Math.max(0, ...data.map((d) => d.cents));
  const rows = data.map((d) => ({
    ...d,
    tip:
      d.month === selected && d.cents > 0
        ? formatAxisMoney(d.cents, currency, locale, d.cents)
        : "",
  }));

  return (
    <ChartContainer
      config={{ cents: { label: seriesName, color: "var(--chart-spend)" } }}
      className="aspect-auto h-full min-h-56 w-full flex-1"
      role="figure"
      aria-label={label}
    >
      <BarChart data={rows} margin={{ top: 22, right: 12, left: 0, bottom: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickCount={4}
          tickFormatter={(v: number) => formatAxisMoney(v, currency, locale, max)}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <MoneyTooltip
              format={(c) => formatMoney(c, currency, locale)}
              names={{ cents: seriesName }}
            />
          }
        />
        <Bar
          dataKey="cents"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
          className={rows.some((r) => r.href) ? "cursor-pointer" : undefined}
          onClick={(_, index) => {
            const href = rows[index]?.href;
            if (href) router.push(href, { scroll: false });
          }}
        >
          {rows.map((d) => (
            <Cell
              key={d.month}
              fill={d.month === selected ? "var(--chart-spend)" : "var(--chart-context)"}
            />
          ))}
          <LabelList
            dataKey="tip"
            position="top"
            offset={8}
            className="fill-foreground text-xs font-medium"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
