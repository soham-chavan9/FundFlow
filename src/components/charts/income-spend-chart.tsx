"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { formatAxisMoney } from "@/lib/format";
import { formatMoney, type Currency } from "@/lib/money";
import { ChartContainer } from "@/components/ui/chart";
import { MoneyTooltip } from "./chart-tooltip";

export interface IncomeSpendPoint {
  month: string;
  label: string;
  fullLabel: string;
  income: number;
  spent: number;
  href: string;
}

/**
 * Income beside spending per month: grouped columns, two series, so a legend
 * names them (the colour is never the only cue) and the page carries a table
 * of the same numbers. One y-axis for both, since they share a unit.
 */
export function IncomeSpendChart({
  data,
  currency,
  names,
  label,
}: {
  data: IncomeSpendPoint[];
  currency: Currency;
  names: { income: string; spent: string };
  label: string;
}) {
  const locale = useLocale();
  const router = useRouter();
  const max = Math.max(0, ...data.flatMap((d) => [d.income, d.spent]));

  return (
    <div className="flex flex-col gap-3">
      <ul className="text-muted-foreground flex items-center gap-4 text-xs" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="bg-chart-income size-2.5 rounded-[3px]" />
          {names.income}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="bg-chart-spend size-2.5 rounded-[3px]" />
          {names.spent}
        </li>
      </ul>
      <ChartContainer
        config={{
          income: { label: names.income, color: "var(--chart-income)" },
          spent: { label: names.spent, color: "var(--chart-spend)" },
        }}
        className="aspect-auto h-64 w-full"
        role="figure"
        aria-label={label}
      >
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          // Size the pair through the category gap rather than maxBarSize, which
          // would centre each narrowed bar in its own slot and split the pair.
          barGap={2}
          barCategoryGap={data.length > 8 ? "34%" : "58%"}
          accessibilityLayer
          onClick={(state) => {
            const i = Number(state?.activeTooltipIndex);
            if (Number.isInteger(i) && data[i]) router.push(data[i].href, { scroll: false });
          }}
          className="cursor-pointer"
        >
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
              <MoneyTooltip format={(c) => formatMoney(c, currency, locale)} names={names} />
            }
          />
          {/* Left to right in declaration order, matching the legend. */}
          <Bar dataKey="income" fill="var(--chart-income)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="spent" fill="var(--chart-spend)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
