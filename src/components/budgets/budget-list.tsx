import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import type { Category } from "@/lib/categories";
import type { BudgetPace } from "@/lib/finance";
import { formatMoney, type Currency } from "@/lib/money";
import { CategoryDot } from "@/components/entries/category-dot";
import { BudgetEditor } from "./budget-editor";
import { BudgetPaceBar } from "./budget-pace-bar";

export interface BudgetLine {
  category: Category;
  pace: BudgetPace;
}

/**
 * Budgeted categories with their pace bars. Used on the dashboard (read-only)
 * and the budgets page (with `editableMonth`, each row gets an editor).
 */
export async function BudgetList({
  lines,
  currency,
  locale,
  editableMonth,
  className,
}: {
  lines: BudgetLine[];
  currency: Currency;
  locale: string;
  editableMonth?: string;
  className?: string;
}) {
  const t = await getTranslations();
  const money = (cents: number) => formatMoney(cents, currency, locale);

  return (
    <ul className={cn("divide-y", className)}>
      {lines.map(({ category, pace }) => {
        const name = t(`categories.${category}`);
        const status =
          pace.state === "over"
            ? t("budgets.overBy", { amount: money(-pace.remainingCents) })
            : pace.state === "ahead"
              ? t("budgets.aheadLeft", { amount: money(pace.remainingCents) })
              : t("budgets.left", { amount: money(pace.remainingCents) });
        return (
          <li key={category} className="flex flex-col gap-2.5 py-4 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <CategoryDot category={category} />
              <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
              <span className="text-muted-foreground text-sm tabular-nums">
                <span className="text-foreground font-medium">{money(pace.spentCents)}</span>
                <span aria-hidden> / </span>
                <span className="sr-only"> {t("budgets.of")} </span>
                {money(pace.limitCents)}
              </span>
              {editableMonth ? (
                <BudgetEditor
                  month={editableMonth}
                  category={category}
                  limitCents={pace.limitCents}
                  currency={currency}
                />
              ) : null}
            </div>
            <BudgetPaceBar
              pace={pace}
              name={name}
              label={t("budgets.meter", {
                category: name,
                spent: money(pace.spentCents),
                limit: money(pace.limitCents),
                status,
              })}
            />
            <p
              className={cn(
                "text-xs tabular-nums",
                pace.state === "onTrack" && "text-muted-foreground",
                pace.state === "ahead" && "text-warning-foreground font-medium",
                pace.state === "over" && "text-destructive font-medium",
              )}
            >
              {status}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
