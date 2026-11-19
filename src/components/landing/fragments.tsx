import { getTranslations } from "next-intl/server";
import { Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { CATEGORIES } from "@/lib/categories";
import { shareOf, sumCents } from "@/lib/finance";
import { formatDay, formatMonth, formatMonthShort, formatPercent } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { BudgetList } from "@/components/budgets/budget-list";
import { SpendTrendChart } from "@/components/charts/spend-trend-chart";
import { SummaryStrip } from "@/components/dashboard/summary-strip";
import { CategoryDot } from "@/components/entries/category-dot";
import {
  SAMPLE_BUDGETS,
  SAMPLE_INCOME_CENTS,
  SAMPLE_MONTH,
  SAMPLE_NOW,
  SAMPLE_SPENT,
  SAMPLE_TREND,
  sampleBudgetLines,
} from "./sample";

/**
 * Pieces of the real product, rendered with the sample month, for the landing
 * page. They are pictures of the app: inert and hidden from assistive tech,
 * with the surrounding copy carrying what they show.
 */

function Frame({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      inert
      className={cn(
        "bg-card overflow-hidden rounded-xl border shadow-[var(--shadow-lift)] select-none",
        className,
      )}
    >
      {title ? (
        <div className="text-muted-foreground flex items-center gap-2 border-b px-4 py-2.5 text-xs">
          <span className="text-foreground font-medium">{title}</span>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export async function SampleBadge({ className }: { className?: string }) {
  const t = await getTranslations("landing");
  return (
    <span
      className={cn(
        "bg-background text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        className,
      )}
    >
      {t("sample")}
    </span>
  );
}

/** The hero: the Overview screen with the sample month. */
export async function OverviewFrame({ locale }: { locale: string }) {
  const t = await getTranslations();
  const budgeted = CATEGORIES.filter((c) => SAMPLE_BUDGETS[c] !== undefined);
  const trend = SAMPLE_TREND.map((p) => ({
    month: p.month,
    label: formatMonthShort(p.month, locale),
    fullLabel: formatMonth(p.month, locale, { standalone: true }),
    cents: p.cents,
  }));
  return (
    <Frame className="landing-frame rounded-2xl">
      <div className="flex h-12 items-center gap-3 border-b px-4 sm:px-5">
        <span className="text-[15px] font-semibold">{t("dashboard.title")}</span>
        <span className="text-muted-foreground text-sm">
          {formatMonth(SAMPLE_MONTH, locale, { standalone: true })}
        </span>
        <SampleBadge className="ml-auto" />
      </div>
      <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
        <SummaryStrip
          month={SAMPLE_MONTH}
          now={SAMPLE_NOW}
          spentCents={sumCents(Object.values(SAMPLE_SPENT))}
          budgetedCents={sumCents(budgeted.map((c) => SAMPLE_BUDGETS[c]!))}
          spentInBudgetsCents={sumCents(budgeted.map((c) => SAMPLE_SPENT[c]))}
          currency="USD"
          locale={locale}
        />
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
          <div className="rounded-xl border p-4 sm:p-5 lg:col-span-3">
            <p className="mb-4 text-sm font-semibold">{t("dashboard.budgetsHeading")}</p>
            <BudgetList
              lines={sampleBudgetLines().slice(0, 4)}
              currency="USD"
              locale={locale}
              className="landing-bars"
            />
          </div>
          <div className="hidden flex-col rounded-xl border p-4 sm:flex sm:p-5 lg:col-span-2">
            <p className="mb-2 text-sm font-semibold">{t("dashboard.trendHeading")}</p>
            <SpendTrendChart
              data={trend}
              selected={SAMPLE_MONTH}
              currency="USD"
              seriesName={t("summary.spent")}
              label={t("dashboard.trendHeading")}
            />
          </div>
        </div>
      </div>
    </Frame>
  );
}

/** The add-expense dialog as it looks filled in, with the warning it raises. */
export async function AddExpenseFragment({ locale }: { locale: string }) {
  const t = await getTranslations();
  const money = (c: number) => formatMoney(c, "USD", locale);
  const field = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="border-input bg-background flex h-8 items-center gap-2 rounded-lg border px-2.5 text-sm">
        {value}
      </span>
    </div>
  );
  return (
    <div className="relative pb-10 sm:pb-12">
      <Frame className="max-w-md">
        <div className="flex flex-col gap-4 p-5">
          <p className="font-semibold">{t("expenses.addTitle")}</p>
          {field(t("expenses.labelField"), t("landing.sampleExpense"))}
          <div className="grid grid-cols-2 gap-4">
            {field(t("entries.amount"), <span className="tabular-nums">{money(12_800)}</span>)}
            {field(
              t("entries.date"),
              <span className="tabular-nums">{formatDay("2026-11-13", locale)}</span>,
            )}
          </div>
          {field(
            t("entries.category"),
            <>
              <CategoryDot category="entertainment" />
              {t("categories.entertainment")}
            </>,
          )}
          <div className="flex justify-end">
            <span className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium">
              {t("expenses.addTitle")}
            </span>
          </div>
        </div>
      </Frame>
      <div
        aria-hidden
        className="bg-popover absolute right-0 bottom-0 flex max-w-xs gap-3 rounded-xl border p-4 text-sm shadow-[var(--shadow-lift)] sm:-right-4"
      >
        <TriangleAlert className="text-warning-foreground mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">
            {t("budgets.overspendTitle", {
              category: t("categories.entertainment"),
              amount: money(2_399),
            })}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {t("budgets.overspendBody", {
              done: t("expenses.added"),
              month: formatMonth(SAMPLE_MONTH, locale),
              limit: money(12_000),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Three budgets, one in each state, with the pace line. */
export async function PaceFragment({ locale }: { locale: string }) {
  const lines = sampleBudgetLines().filter((l) =>
    ["entertainment", "food", "transport"].includes(l.category),
  );
  return (
    <Frame>
      <div className="p-5">
        <BudgetList lines={lines} currency="USD" locale={locale} />
      </div>
    </Frame>
  );
}

/** Where the money went: ranked category bars with share. */
export async function InsightsFragment({ locale }: { locale: string }) {
  const t = await getTranslations();
  const total = sumCents(Object.values(SAMPLE_SPENT));
  const rows = CATEGORIES.filter((c) => SAMPLE_SPENT[c] > 0).sort(
    (a, b) => SAMPLE_SPENT[b] - SAMPLE_SPENT[a],
  );
  const max = SAMPLE_SPENT[rows[0]];
  const net = SAMPLE_INCOME_CENTS - total;
  return (
    <Frame>
      <div className="grid grid-cols-3 border-b text-sm">
        {[
          [t("insights.income"), formatMoney(SAMPLE_INCOME_CENTS, "USD", locale)],
          [t("summary.spent"), formatMoney(total, "USD", locale)],
          [t("insights.net"), formatMoney(net, "USD", locale, { signDisplay: "exceptZero" })],
        ].map(([label, value], i) => (
          <div key={label} className={cn("p-4", i > 0 && "border-l")}>
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className={cn("mt-1 font-semibold", i === 2 && "text-success")}>{value}</p>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-3 p-5">
        {rows.map((c) => (
          <li key={c} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm">
            <span className="flex items-center gap-2 truncate">
              <CategoryDot category={c} />
              {t(`categories.${c}`)}
            </span>
            <span className="bg-muted h-2 overflow-hidden rounded-full">
              <span
                className="bg-chart-spend block h-full rounded-full"
                style={{ width: `${shareOf(SAMPLE_SPENT[c], max) * 100}%` }}
              />
            </span>
            <span className="text-muted-foreground w-12 text-right tabular-nums">
              {formatPercent(shareOf(SAMPLE_SPENT[c], total), locale)}
            </span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

/** A grounded question and answer, as the assistant shows it. */
export async function AssistantFragment({ locale }: { locale: string }) {
  const t = await getTranslations();
  const money = (c: number) => formatMoney(c, "USD", locale);
  return (
    <Frame>
      <div className="flex flex-col gap-4 p-5 text-sm">
        <p className="bg-secondary self-end rounded-2xl rounded-br-md px-4 py-2.5">
          {t("assistant.suggestion2")}
        </p>
        <div className="flex gap-3">
          <span className="bg-primary/10 text-primary grid size-7 shrink-0 place-items-center rounded-md">
            <Sparkles className="size-3.5" />
          </span>
          <p className="leading-relaxed">
            {t("landing.sampleAnswer", {
              spent: money(14_399),
              limit: money(12_000),
              ticket: money(12_800),
              food: money(37_601),
              foodLimit: money(50_000),
            })}
          </p>
        </div>
      </div>
    </Frame>
  );
}
