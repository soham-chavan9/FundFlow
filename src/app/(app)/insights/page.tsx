import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, ChartNoAxesColumn } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "cn";
import { requireUser } from "@/lib/auth/dal";
import { lastMonths, shiftMonth, toMonthKey } from "@/lib/dates";
import { buildMonthlyReport, buildYearlyReport, savingsRate, shareOf } from "@/lib/finance";
import { formatMonth, formatMonthName, formatMonthShort, formatPercent } from "@/lib/format";
import { resolveMonth } from "@/lib/month-param";
import { formatMoney, type Currency } from "@/lib/money";
import { categoryTotals, getBudgets, monthlyTotals } from "@/server/ledger";
import { IncomeSpendChart, type IncomeSpendPoint } from "@/components/charts/income-spend-chart";
import { CategoryDot } from "@/components/entries/category-dot";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("insights");
  return { title: t("title") };
}

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function InsightsPage({ searchParams }: PageProps<"/insights">) {
  const user = await requireUser();
  const [t, locale, params] = await Promise.all([getTranslations(), getLocale(), searchParams]);
  const now = new Date();
  const currentMonth = toMonthKey(now);
  const currentYear = now.getUTCFullYear();
  const view = first(params.view) === "year" ? "year" : "month";
  const requestedYear = Number.parseInt(first(params.year) ?? "", 10);
  const year =
    Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentYear + 1
      ? requestedYear
      : currentYear;
  const month = resolveMonth(params.month, now);

  return (
    <>
      <PageHeader title={t("insights.title")}>
        <ViewToggle view={view} month={month} year={year} currentMonth={currentMonth} />
        {view === "month" ? (
          <Suspense>
            <MonthSwitcher month={month} currentMonth={currentMonth} />
          </Suspense>
        ) : (
          <YearSwitcher year={year} currentYear={currentYear} />
        )}
      </PageHeader>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
        {view === "month" ? (
          <MonthView userId={user.id} currency={user.currency} month={month} locale={locale} />
        ) : (
          <YearView
            userId={user.id}
            currency={user.currency}
            year={year}
            locale={locale}
            currentMonth={currentMonth}
          />
        )}
      </div>
    </>
  );
}

async function ViewToggle({
  view,
  month,
  year,
  currentMonth,
}: {
  view: "month" | "year";
  month: string;
  year: number;
  currentMonth: string;
}) {
  const t = await getTranslations("insights");
  const monthHref = month === currentMonth ? "/insights" : `/insights?month=${month}`;
  const yearHref = `/insights?view=year&year=${view === "month" ? month.slice(0, 4) : year}`;
  const item = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      active
        ? "bg-background text-foreground shadow-[var(--shadow-soft)]"
        : "text-muted-foreground hover:text-foreground",
    );
  return (
    <nav aria-label={t("period")} className="bg-muted flex rounded-lg p-0.5">
      <Link
        href={monthHref}
        aria-current={view === "month" ? "page" : undefined}
        className={item(view === "month")}
      >
        {t("viewMonth")}
      </Link>
      <Link
        href={yearHref}
        aria-current={view === "year" ? "page" : undefined}
        className={item(view === "year")}
      >
        {t("viewYear")}
      </Link>
    </nav>
  );
}

async function YearSwitcher({ year, currentYear }: { year: number; currentYear: number }) {
  const t = await getTranslations("insights");
  const href = (y: number) => `/insights?view=year&year=${y}`;
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("previousYear")}>
        <Link href={href(year - 1)} scroll={false}>
          <ChevronLeft />
        </Link>
      </Button>
      <span className="min-w-12 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {year}
      </span>
      {year < currentYear ? (
        <Button asChild variant="ghost" size="icon-sm" aria-label={t("nextYear")}>
          <Link href={href(year + 1)} scroll={false}>
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="ghost" size="icon-sm" disabled aria-label={t("nextYear")}>
          <ChevronRight />
        </Button>
      )}
    </div>
  );
}

/** A row of figures for the period: label above, value below, hairlines between. */
function StatRow({ items }: { items: { label: string; value: string; tone?: "good" | "bad" }[] }) {
  return (
    <dl className="bg-border grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-card flex flex-col gap-1 p-4 sm:p-5">
          <dt className="text-muted-foreground text-sm">{item.label}</dt>
          <dd
            className={cn(
              "text-xl font-semibold tracking-tight sm:text-2xl",
              item.tone === "good" && "text-success",
              item.tone === "bad" && "text-destructive",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function netTone(cents: number) {
  return cents > 0 ? "good" : cents < 0 ? "bad" : undefined;
}

async function MonthView({
  userId,
  currency,
  month,
  locale,
}: {
  userId: string;
  currency: Currency;
  month: string;
  locale: string;
}) {
  const t = await getTranslations();
  const previousMonth = shiftMonth(month, -1);
  const months = lastMonths(month, 6);
  const [current, previous, budgets, spentByMonth, incomeByMonth] = await Promise.all([
    categoryTotals(userId, month),
    categoryTotals(userId, previousMonth),
    getBudgets(userId, month),
    monthlyTotals(userId, "expenses", months),
    monthlyTotals(userId, "incomes", months),
  ]);
  const report = buildMonthlyReport(current, previous, budgets);
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const incomeCents = incomeByMonth[incomeByMonth.length - 1]?.cents ?? 0;
  const net = incomeCents - report.totalCents;
  const rate = savingsRate(incomeCents, report.totalCents);
  const maxSpent = Math.max(0, ...report.rows.map((r) => r.spentCents));
  const monthLabel = formatMonth(month, locale);
  const previousName = formatMonthName(previousMonth, locale, { standalone: false });
  const chartData: IncomeSpendPoint[] = months.map((m, i) => ({
    month: m,
    label: formatMonthShort(m, locale),
    fullLabel: formatMonth(m, locale, { standalone: true }),
    income: incomeByMonth[i].cents,
    spent: spentByMonth[i].cents,
    href: `/insights?month=${m}`,
  }));

  return (
    <>
      <StatRow
        items={[
          { label: t("insights.income"), value: money(incomeCents) },
          { label: t("summary.spent"), value: money(report.totalCents) },
          {
            label: t("insights.net"),
            value: formatMoney(net, currency, locale, { signDisplay: "exceptZero" }),
            tone: netTone(net),
          },
          {
            label: t("insights.savingsRate"),
            value: rate === null ? "—" : formatPercent(rate, locale),
            tone: rate === null ? undefined : netTone(rate),
          },
        ]}
      />

      <section aria-labelledby="where-heading" className="bg-card rounded-xl border">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3 sm:px-5">
          <h2 id="where-heading" className="font-semibold">
            {t("insights.whereHeading", { month: monthLabel })}
          </h2>
          {report.change !== null ? (
            <p className="text-muted-foreground text-sm">
              {t("insights.totalChange", {
                change: formatPercent(report.change, locale, { signDisplay: "exceptZero" }),
                month: previousName,
              })}
            </p>
          ) : null}
        </header>
        {report.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <ChartNoAxesColumn className="text-muted-foreground size-5" aria-hidden />
            <p className="font-medium">{t("insights.noSpendTitle", { month: monthLabel })}</p>
            <p className="text-muted-foreground max-w-sm text-sm">{t("insights.noSpendBody")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 sm:pl-5">{t("entries.category")}</TableHead>
                <TableHead className="hidden w-[30%] md:table-cell">
                  <span className="sr-only">{t("insights.share")}</span>
                </TableHead>
                <TableHead className="text-right">{t("summary.spent")}</TableHead>
                <TableHead className="hidden text-right sm:table-cell">
                  {t("insights.share")}
                </TableHead>
                <TableHead className="hidden text-right lg:table-cell">
                  {t("insights.budget")}
                </TableHead>
                <TableHead className="pr-4 text-right sm:pr-5">
                  {t("insights.vsMonth", { month: previousName })}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((row) => (
                <TableRow key={row.category}>
                  <TableCell className="pl-4 sm:pl-5">
                    <span className="flex items-center gap-2">
                      <CategoryDot category={row.category} />
                      {t(`categories.${row.category}`)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell" aria-hidden>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-chart-spend h-full rounded-full"
                        style={{ width: `${shareOf(row.spentCents, maxSpent) * 100}%` }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {money(row.spentCents)}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden text-right tabular-nums sm:table-cell">
                    {formatPercent(row.share, locale)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "hidden text-right tabular-nums lg:table-cell",
                      row.budgetCents === null && "text-muted-foreground",
                      row.budgetCents !== null &&
                        row.spentCents > row.budgetCents &&
                        "text-destructive",
                    )}
                  >
                    {row.budgetCents === null ? "—" : money(row.budgetCents)}
                  </TableCell>
                  <TableCell className="pr-4 text-right tabular-nums sm:pr-5">
                    <Change value={row.change} spent={row.spentCents} locale={locale} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow className="hover:bg-transparent">
                <TableCell className="pl-4 font-medium sm:pl-5">{t("insights.total")}</TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="text-right font-semibold tabular-nums">
                  {money(report.totalCents)}
                </TableCell>
                <TableCell className="hidden sm:table-cell" />
                <TableCell className="text-muted-foreground hidden text-right tabular-nums lg:table-cell">
                  {report.budgetedCents > 0 ? money(report.budgetedCents) : "—"}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums sm:pr-5">
                  <Change value={report.change} spent={report.totalCents} locale={locale} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}
      </section>

      <section aria-labelledby="flow-heading" className="bg-card rounded-xl border">
        <header className="border-b px-4 py-3 sm:px-5">
          <h2 id="flow-heading" className="font-semibold">
            {t("insights.flowHeading")}
          </h2>
        </header>
        <div className="p-4 sm:p-5">
          <IncomeSpendChart
            data={chartData}
            currency={currency}
            names={{ income: t("insights.income"), spent: t("summary.spent") }}
            label={t("insights.flowHeading")}
          />
          <FlowTable
            data={chartData}
            currency={currency}
            locale={locale}
            caption={t("insights.flowHeading")}
          />
        </div>
      </section>
    </>
  );
}

/** Spending change against the previous period. More spending reads red, less reads green; the sign carries it too. */
async function Change({
  value,
  spent,
  locale,
}: {
  value: number | null;
  spent: number;
  locale: string;
}) {
  const t = await getTranslations("insights");
  if (value === null) {
    return <span className="text-muted-foreground">{spent > 0 ? t("new") : "—"}</span>;
  }
  // Under half a percent rounds to no change; don't colour noise.
  if (Math.abs(value) < 0.005) return <span className="text-muted-foreground">0%</span>;
  return (
    <span className={cn(value > 0 && "text-destructive", value < 0 && "text-success")}>
      {formatPercent(value, locale, { signDisplay: "exceptZero" })}
    </span>
  );
}

/** The chart's numbers as a table, for screen readers. */
async function FlowTable({
  data,
  currency,
  locale,
  caption,
}: {
  data: IncomeSpendPoint[];
  currency: Currency;
  locale: string;
  caption: string;
}) {
  const t = await getTranslations();
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{t("summary.month")}</th>
          <th scope="col">{t("insights.income")}</th>
          <th scope="col">{t("summary.spent")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.month}>
            <th scope="row">{p.fullLabel}</th>
            <td>{formatMoney(p.income, currency, locale)}</td>
            <td>{formatMoney(p.spent, currency, locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function YearView({
  userId,
  currency,
  year,
  locale,
  currentMonth,
}: {
  userId: string;
  currency: Currency;
  year: number;
  locale: string;
  currentMonth: string;
}) {
  const t = await getTranslations();
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const [spent, income] = await Promise.all([
    monthlyTotals(userId, "expenses", months),
    monthlyTotals(userId, "incomes", months),
  ]);
  const report = buildYearlyReport(year, spent, income, currentMonth);
  const money = (cents: number) => formatMoney(cents, currency, locale);
  const signed = (cents: number) =>
    formatMoney(cents, currency, locale, { signDisplay: "exceptZero" });
  const chartData: IncomeSpendPoint[] = report.rows.map((r) => ({
    month: r.month,
    label: formatMonthShort(r.month, locale),
    fullLabel: formatMonth(r.month, locale, { standalone: true }),
    income: r.incomeCents,
    spent: r.spentCents,
    href: `/insights?month=${r.month}`,
  }));
  const rate = savingsRate(report.incomeCents, report.spentCents);
  const firstActive = report.rows.find((r) => r.spentCents > 0 || r.incomeCents > 0)?.month;

  return (
    <>
      <StatRow
        items={[
          { label: t("insights.income"), value: money(report.incomeCents) },
          { label: t("summary.spent"), value: money(report.spentCents) },
          {
            label: t("insights.net"),
            value: signed(report.netCents),
            tone: netTone(report.netCents),
          },
          {
            label: t("insights.avgSpend"),
            value: report.averageSpentCents === null ? "—" : money(report.averageSpentCents),
          },
        ]}
      />

      <section aria-labelledby="year-chart-heading" className="bg-card rounded-xl border">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3 sm:px-5">
          <h2 id="year-chart-heading" className="font-semibold">
            {t("insights.flowYearHeading", { year })}
          </h2>
          {rate !== null ? (
            <p className="text-muted-foreground text-sm">
              {t("insights.yearSavingsRate", { rate: formatPercent(rate, locale) })}
            </p>
          ) : null}
        </header>
        <div className="p-4 sm:p-5">
          <IncomeSpendChart
            data={chartData}
            currency={currency}
            names={{ income: t("insights.income"), spent: t("summary.spent") }}
            label={t("insights.flowYearHeading", { year })}
          />
        </div>
      </section>

      <section aria-labelledby="year-table-heading" className="bg-card rounded-xl border">
        <header className="border-b px-4 py-3 sm:px-5">
          <h2 id="year-table-heading" className="font-semibold">
            {t("insights.byMonthHeading", { year })}
          </h2>
        </header>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4 sm:pl-5">{t("summary.month")}</TableHead>
              <TableHead className="text-right">{t("insights.income")}</TableHead>
              <TableHead className="text-right">{t("summary.spent")}</TableHead>
              <TableHead className="pr-4 text-right sm:pr-5">{t("insights.net")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.rows.map((r) => {
              // Months still to come, or before anything was recorded, have no figures to show.
              const future = r.month > currentMonth || !firstActive || r.month < firstActive;
              return (
                <TableRow key={r.month} className={cn(future && "text-muted-foreground")}>
                  <TableCell className="pl-4 sm:pl-5">
                    {future ? (
                      formatMonthName(r.month, locale)
                    ) : (
                      <Link
                        href={`/insights?month=${r.month}`}
                        className="decoration-border hover:decoration-foreground font-medium underline underline-offset-4"
                      >
                        {formatMonthName(r.month, locale)}
                      </Link>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {future ? "—" : money(r.incomeCents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {future ? "—" : money(r.spentCents)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right font-medium tabular-nums sm:pr-5",
                      !future && r.netCents > 0 && "text-success",
                      !future && r.netCents < 0 && "text-destructive",
                    )}
                  >
                    {future ? "—" : signed(r.netCents)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              <TableCell className="pl-4 font-medium sm:pl-5">{t("insights.total")}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {money(report.incomeCents)}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {money(report.spentCents)}
              </TableCell>
              <TableCell
                className={cn(
                  "pr-4 text-right font-semibold tabular-nums sm:pr-5",
                  report.netCents > 0 && "text-success",
                  report.netCents < 0 && "text-destructive",
                )}
              >
                {signed(report.netCents)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </section>
    </>
  );
}
