import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import { monthProgress } from "@/lib/dates";
import { formatMoney, type Currency } from "@/lib/money";

/**
 * The month at a glance: spent, budgeted, left, and where we are in the
 * month. Hairline-divided cells on one surface, tabular figures throughout.
 */
export async function SummaryStrip({
  month,
  now,
  spentCents,
  budgetedCents,
  spentInBudgetsCents,
  currency,
  locale,
}: {
  month: string;
  now: Date;
  spentCents: number;
  budgetedCents: number;
  /** Spending in categories that have a budget; what "left" is measured against. */
  spentInBudgetsCents: number;
  currency: Currency;
  locale: string;
}) {
  const t = await getTranslations("summary");
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const { days, elapsed } = monthProgress(month, now);
  const hasBudgets = budgetedCents > 0;
  const leftCents = budgetedCents - spentInBudgetsCents;
  const outside = spentCents - spentInBudgetsCents;

  const progress =
    elapsed === 0
      ? { value: t("notStarted"), detail: t("daysInMonth", { days }) }
      : elapsed >= days
        ? { value: t("closed"), detail: t("daysInMonth", { days }) }
        : {
            value: t("day", { day: elapsed }),
            detail: t("dayDetail", { days, left: days - elapsed }),
          };

  const cells: { label: string; value: string; detail?: string; tone?: "over" }[] = [
    {
      label: t("spent"),
      value: money(spentCents),
      detail:
        hasBudgets && outside > 0 ? t("outsideBudgets", { amount: money(outside) }) : undefined,
    },
    {
      label: t("budgeted"),
      value: hasBudgets ? money(budgetedCents) : "—",
      detail: hasBudgets ? undefined : t("noBudgets"),
    },
    {
      label: leftCents < 0 ? t("overBudget") : t("left"),
      value: hasBudgets ? money(Math.abs(leftCents)) : "—",
      detail: hasBudgets ? t("ofBudgeted", { amount: money(budgetedCents) }) : undefined,
      tone: leftCents < 0 ? "over" : undefined,
    },
    { label: t("month"), value: progress.value, detail: progress.detail },
  ];

  return (
    <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4">
      {cells.map((cell) => (
        <div key={cell.label} className="bg-card flex flex-col gap-1 p-4 sm:p-5">
          <dt className="text-muted-foreground text-sm">{cell.label}</dt>
          <dd
            className={cn(
              "text-xl font-semibold tracking-tight tabular-nums sm:text-2xl",
              cell.tone === "over" && "text-destructive",
            )}
          >
            {cell.value}
          </dd>
          {cell.detail ? (
            <dd className="text-muted-foreground text-xs tabular-nums">{cell.detail}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
