import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, PiggyBank, ReceiptText, TriangleAlert } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { CATEGORIES, isFixedCategory } from "@/lib/categories";
import { lastMonths, monthProgress, toMonthKey } from "@/lib/dates";
import { budgetPace, sumCents } from "@/lib/finance";
import { formatDay, formatMonth, formatMonthShort } from "@/lib/format";
import { resolveMonth } from "@/lib/month-param";
import { formatMoney } from "@/lib/money";
import {
  categoryTotals,
  getBudgets,
  hasAnyActivity,
  monthlyTotals,
  recentExpenses,
} from "@/server/ledger";
import { BudgetList } from "@/components/budgets/budget-list";
import { SpendTrendChart } from "@/components/charts/spend-trend-chart";
import { SummaryStrip } from "@/components/dashboard/summary-strip";
import { AddEntryButton } from "@/components/entries/add-entry-button";
import { CategoryDot } from "@/components/entries/category-dot";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { PageHeader } from "@/components/shell/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const now = new Date();
  const currentMonth = toMonthKey(now);
  const month = resolveMonth((await searchParams).month, now);
  const withMonth = (path: string, m = month) => (m === currentMonth ? path : `${path}?month=${m}`);

  const header = (
    <PageHeader title={t("dashboard.title")}>
      <Suspense>
        <MonthSwitcher month={month} currentMonth={currentMonth} />
      </Suspense>
      <AddEntryButton currency={user.currency} />
    </PageHeader>
  );

  if (!(await hasAnyActivity(user.id))) {
    return (
      <>
        {header}
        <div className="flex flex-1 items-center justify-center p-6">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ReceiptText />
              </EmptyMedia>
              <EmptyTitle>{t("dashboard.emptyTitle")}</EmptyTitle>
              <EmptyDescription>{t("dashboard.emptyBody")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center gap-2">
              <AddEntryButton currency={user.currency} variant="inline" />
              <Button asChild variant="outline">
                <Link href="/budgets">{t("dashboard.setBudget")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </>
    );
  }

  const trendMonths = lastMonths(month, 6);
  const [spent, budgets, trend, recent] = await Promise.all([
    categoryTotals(user.id, month),
    getBudgets(user.id, month),
    monthlyTotals(user.id, "expenses", trendMonths),
    recentExpenses(user.id, month, 6),
  ]);

  const progress = monthProgress(month, now);
  const budgeted = CATEGORIES.filter((c) => budgets[c] !== undefined);
  const lines = budgeted
    .map((category) => ({
      category,
      pace: budgetPace(spent[category], budgets[category]!, progress, {
        fixed: isFixedCategory(category),
      }),
    }))
    .sort((a, b) => b.pace.ratio - a.pace.ratio);
  const over = lines.filter((l) => l.pace.state === "over");
  const money = (cents: number) => formatMoney(cents, user.currency, locale);
  const monthLabel = formatMonth(month, locale);
  const trendData = trend.map((p) => ({
    month: p.month,
    label: formatMonthShort(p.month, locale),
    fullLabel: formatMonth(p.month, locale, { standalone: true }),
    cents: p.cents,
    href: withMonth("/dashboard", p.month),
  }));

  return (
    <>
      {header}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <SummaryStrip
          month={month}
          now={now}
          spentCents={sumCents(Object.values(spent))}
          budgetedCents={sumCents(budgeted.map((c) => budgets[c]!))}
          spentInBudgetsCents={sumCents(budgeted.map((c) => spent[c]))}
          currency={user.currency}
          locale={locale}
        />

        {over.length > 0 ? (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t("dashboard.overTitle", { count: over.length })}</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {over
                  .map((l) =>
                    t("dashboard.overItem", {
                      category: t(`categories.${l.category}`),
                      amount: money(-l.pace.remainingCents),
                    }),
                  )
                  .join(" · ")}
              </span>
              <Link
                href={withMonth("/budgets")}
                className="text-foreground font-medium underline underline-offset-4"
              >
                {t("dashboard.reviewBudgets")}
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-5">
          <section
            aria-labelledby="dash-budgets"
            className="bg-card flex flex-col rounded-xl border lg:col-span-3"
          >
            <header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
              <h2 id="dash-budgets" className="font-semibold">
                {t("dashboard.budgetsHeading")}
              </h2>
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link href={withMonth("/budgets")}>
                  {t("dashboard.manage")}
                  <ArrowRight />
                </Link>
              </Button>
            </header>
            <div className="flex-1 p-4 sm:p-5">
              {lines.length > 0 ? (
                <BudgetList lines={lines} currency={user.currency} locale={locale} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
                  <PiggyBank className="text-muted-foreground size-5" aria-hidden />
                  <p className="text-muted-foreground max-w-xs text-sm text-balance">
                    {t("dashboard.noBudgets", { month: monthLabel })}
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href={withMonth("/budgets")}>{t("dashboard.setBudget")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section
            aria-labelledby="dash-trend"
            className="bg-card flex flex-col rounded-xl border lg:col-span-2"
          >
            <header className="border-b px-4 py-3 sm:px-5">
              <h2 id="dash-trend" className="font-semibold">
                {t("dashboard.trendHeading")}
              </h2>
            </header>
            <div className="flex flex-1 flex-col justify-end p-4 sm:p-5">
              <SpendTrendChart
                data={trendData}
                selected={month}
                currency={user.currency}
                seriesName={t("summary.spent")}
                label={t("dashboard.trendHeading")}
              />
              <table className="sr-only">
                <caption>{t("dashboard.trendHeading")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("summary.month")}</th>
                    <th scope="col">{t("summary.spent")}</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.map((p) => (
                    <tr key={p.month}>
                      <th scope="row">{p.fullLabel}</th>
                      <td>{money(p.cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section aria-labelledby="dash-recent" className="bg-card rounded-xl border">
          <header className="flex items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
            <h2 id="dash-recent" className="font-semibold">
              {t("dashboard.recentHeading")}
            </h2>
            {recent.length > 0 ? (
              <Button asChild variant="ghost" size="sm" className="-mr-2">
                <Link href={withMonth("/expenses")}>
                  {t("dashboard.viewAll")}
                  <ArrowRight />
                </Link>
              </Button>
            ) : null}
          </header>
          {recent.length > 0 ? (
            <ul className="divide-y">
              {recent.map((row) => (
                <li key={row.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <span className="text-muted-foreground w-14 shrink-0 text-sm tabular-nums">
                    {formatDay(row.date, locale)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{row.title}</span>
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                      <CategoryDot category={row.category} />
                      {t(`categories.${row.category}`)}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">{money(row.amountCents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm sm:px-5">
              {t("dashboard.noRecent", { month: monthLabel })}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
