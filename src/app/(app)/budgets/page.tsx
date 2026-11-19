import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { CATEGORIES, isFixedCategory, type Category } from "@/lib/categories";
import { monthProgress, shiftMonth, toMonthKey } from "@/lib/dates";
import { budgetPace, sumCents } from "@/lib/finance";
import { formatMonth } from "@/lib/format";
import { resolveMonth } from "@/lib/month-param";
import { formatMoney } from "@/lib/money";
import { categoryTotals, getBudgets } from "@/server/ledger";
import { BudgetEditor } from "@/components/budgets/budget-editor";
import { BudgetList } from "@/components/budgets/budget-list";
import { CopyBudgetsButton } from "@/components/budgets/copy-budgets-button";
import { SummaryStrip } from "@/components/dashboard/summary-strip";
import { AddEntryButton } from "@/components/entries/add-entry-button";
import { CategoryDot } from "@/components/entries/category-dot";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { PageHeader } from "@/components/shell/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("budgets");
  return { title: t("title") };
}

export default async function BudgetsPage({ searchParams }: PageProps<"/budgets">) {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const now = new Date();
  const currentMonth = toMonthKey(now);
  const month = resolveMonth((await searchParams).month, now);
  const previousMonth = shiftMonth(month, -1);
  const [budgets, previousBudgets, spent] = await Promise.all([
    getBudgets(user.id, month),
    getBudgets(user.id, previousMonth),
    categoryTotals(user.id, month),
  ]);

  const progress = monthProgress(month, now);
  const budgeted = CATEGORIES.filter((c) => budgets[c] !== undefined);
  const unbudgeted = CATEGORIES.filter((c) => budgets[c] === undefined);
  const lines = budgeted
    .map((category) => ({
      category,
      pace: budgetPace(spent[category], budgets[category]!, progress, {
        fixed: isFixedCategory(category),
      }),
    }))
    .sort((a, b) => b.pace.ratio - a.pace.ratio);
  const copyable = Object.keys(previousBudgets).filter(
    (c) => budgets[c as Category] === undefined,
  ).length;
  const money = (cents: number) => formatMoney(cents, user.currency, locale);

  return (
    <>
      <PageHeader title={t("budgets.title")}>
        <Suspense>
          <MonthSwitcher month={month} currentMonth={currentMonth} />
        </Suspense>
        <AddEntryButton currency={user.currency} />
      </PageHeader>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <SummaryStrip
          month={month}
          now={now}
          spentCents={sumCents(Object.values(spent))}
          budgetedCents={sumCents(budgeted.map((c) => budgets[c]!))}
          spentInBudgetsCents={sumCents(budgeted.map((c) => spent[c]))}
          currency={user.currency}
          locale={locale}
        />

        {copyable > 0 ? (
          <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex-1">
              <p className="font-medium">{t("budgets.copyTitle")}</p>
              <p className="text-muted-foreground text-sm">
                {t("budgets.copyBody", {
                  count: copyable,
                  month: formatMonth(previousMonth, locale),
                })}
              </p>
            </div>
            <CopyBudgetsButton
              month={month}
              variant={budgeted.length === 0 ? "default" : "outline"}
            />
          </div>
        ) : null}

        <section aria-labelledby="budgeted-heading" className="bg-card rounded-xl border">
          <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3 sm:px-5">
            <h2 id="budgeted-heading" className="font-semibold">
              {t("budgets.budgetedHeading", { month: formatMonth(month, locale) })}
            </h2>
            {lines.length > 0 && progress.elapsed > 0 && progress.elapsed < progress.days ? (
              <p className="text-muted-foreground flex items-center gap-2 text-xs">
                <span aria-hidden className="bg-pace inline-block h-3 w-0.5 rounded-full" />
                {t("budgets.paceLegend")}
              </p>
            ) : null}
          </header>
          <div className="p-4 sm:p-5">
            {lines.length > 0 ? (
              <BudgetList
                lines={lines}
                currency={user.currency}
                locale={locale}
                editableMonth={month}
              />
            ) : (
              <div className="flex flex-col gap-1 py-6 text-center">
                <p className="font-medium">{t("budgets.emptyTitle")}</p>
                <p className="text-muted-foreground mx-auto max-w-sm text-sm text-balance">
                  {t("budgets.emptyBody")}
                </p>
              </div>
            )}
          </div>
        </section>

        {unbudgeted.length > 0 ? (
          <section aria-labelledby="unbudgeted-heading" className="flex flex-col gap-3">
            <div>
              <h2 id="unbudgeted-heading" className="font-semibold">
                {t("budgets.notBudgeted")}
              </h2>
              <p className="text-muted-foreground text-sm">{t("budgets.notBudgetedHint")}</p>
            </div>
            <ul className="bg-card divide-y rounded-xl border">
              {unbudgeted.map((category) => (
                <li key={category} className="flex items-center gap-3 px-4 py-2.5 sm:px-5">
                  <CategoryDot category={category} />
                  <span className="min-w-0 flex-1 truncate">{t(`categories.${category}`)}</span>
                  {spent[category] > 0 ? (
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {t("budgets.spentAmount", { amount: money(spent[category]) })}
                    </span>
                  ) : null}
                  <BudgetEditor month={month} category={category} currency={user.currency} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
