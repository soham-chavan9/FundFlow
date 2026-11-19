import { CATEGORIES, type Category } from "./categories";

/**
 * Pure money math shared by the dashboard, budgets, insights and the
 * overspend warning. Everything is integer cents; nothing here touches the
 * database, so it is all unit-tested.
 */

export type CategoryTotals = Record<Category, number>;
export type BudgetMap = Partial<Record<Category, number>>;

export function emptyCategoryTotals(): CategoryTotals {
  return Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as CategoryTotals;
}

export function sumCents(values: Iterable<number>): number {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

export function totalsByCategory(
  rows: Iterable<{ category: Category; amountCents: number }>,
): CategoryTotals {
  const totals = emptyCategoryTotals();
  for (const row of rows) totals[row.category] += row.amountCents;
  return totals;
}

/** 0..1 share of a total; 0 when the total is 0. */
export function shareOf(part: number, total: number): number {
  return total > 0 ? part / total : 0;
}

/** Relative change, or null when there is nothing to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/** Share of income kept. Null without income. Negative when spending exceeds income. */
export function savingsRate(incomeCents: number, spentCents: number): number | null {
  if (incomeCents <= 0) return null;
  return (incomeCents - spentCents) / incomeCents;
}

export type PaceState = "onTrack" | "ahead" | "over";

export interface BudgetPace {
  spentCents: number;
  limitCents: number;
  /** Negative when over budget. */
  remainingCents: number;
  /** spent / limit, not clamped (1.2 = 20% over). */
  ratio: number;
  /** How far through the month we are, 0..1. Where the pace line sits. */
  paceRatio: number;
  state: PaceState;
}

/**
 * Spending counts as ahead of pace once it is more than 5% of the budget past
 * the straight-line expectation for today. The slack stops a single early bill
 * from flagging a category on day one.
 */
export const PACE_SLACK = 0.05;

export function budgetPace(
  spentCents: number,
  limitCents: number,
  progress: { days: number; elapsed: number },
): BudgetPace {
  const paceRatio = progress.days > 0 ? Math.min(1, progress.elapsed / progress.days) : 0;
  const ratio = limitCents > 0 ? spentCents / limitCents : spentCents > 0 ? Infinity : 0;
  let state: PaceState = "onTrack";
  if (spentCents > limitCents) state = "over";
  else if (spentCents > limitCents * (paceRatio + PACE_SLACK)) state = "ahead";
  return {
    spentCents,
    limitCents,
    remainingCents: limitCents - spentCents,
    ratio,
    paceRatio,
    state,
  };
}

/**
 * After a change moved a category total from `previous` to `next`, how far
 * over the budget it now is, or null when no warning is due. Warns whenever a
 * change adds to a category that ends up over its limit, not only on the
 * crossing, so every addition to an over-budget category is flagged.
 */
export function overspendAfterChange(
  previousCents: number,
  nextCents: number,
  limitCents: number | undefined,
): number | null {
  if (limitCents === undefined) return null;
  if (nextCents <= limitCents || nextCents <= previousCents) return null;
  return nextCents - limitCents;
}

export interface MonthTotal {
  month: string;
  cents: number;
}

/** Puts per-month sums on a fixed axis of month keys, filling gaps with 0. */
export function fillMonths(months: string[], rows: Iterable<MonthTotal>): MonthTotal[] {
  const byMonth = new Map<string, number>();
  for (const r of rows) byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.cents);
  return months.map((month) => ({ month, cents: byMonth.get(month) ?? 0 }));
}

export interface MonthlyReportRow {
  category: Category;
  spentCents: number;
  previousCents: number;
  budgetCents: number | null;
  /** Share of this month's total spend, 0..1. */
  share: number;
  change: number | null;
}

export interface MonthlyReport {
  rows: MonthlyReportRow[];
  totalCents: number;
  previousTotalCents: number;
  change: number | null;
  budgetedCents: number;
}

/**
 * The month's spending by category, compared with the previous month and the
 * budget. Categories with no spend, no budget and no spend last month are left
 * out. Largest spend first.
 */
export function buildMonthlyReport(
  current: CategoryTotals,
  previous: CategoryTotals,
  budgets: BudgetMap,
): MonthlyReport {
  const totalCents = sumCents(Object.values(current));
  const previousTotalCents = sumCents(Object.values(previous));
  const rows = CATEGORIES.filter(
    (c) => current[c] > 0 || previous[c] > 0 || budgets[c] !== undefined,
  )
    .map<MonthlyReportRow>((category) => ({
      category,
      spentCents: current[category],
      previousCents: previous[category],
      budgetCents: budgets[category] ?? null,
      share: shareOf(current[category], totalCents),
      change: percentChange(current[category], previous[category]),
    }))
    .sort(
      (a, b) =>
        b.spentCents - a.spentCents ||
        CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category),
    );
  return {
    rows,
    totalCents,
    previousTotalCents,
    change: percentChange(totalCents, previousTotalCents),
    budgetedCents: sumCents(Object.values(budgets).filter((v): v is number => v !== undefined)),
  };
}

export interface YearlyReportRow {
  month: string;
  spentCents: number;
  incomeCents: number;
  netCents: number;
}

export interface YearlyReport {
  rows: YearlyReportRow[];
  spentCents: number;
  incomeCents: number;
  netCents: number;
  /** Average spend over the months of the year that have started, or null if none have. */
  averageSpentCents: number | null;
}

/**
 * Twelve months of spend and income for a year. `throughMonth` is the current
 * month key; later months still appear (as zero) but are left out of the
 * average.
 */
export function buildYearlyReport(
  year: number,
  spent: Iterable<MonthTotal>,
  income: Iterable<MonthTotal>,
  throughMonth: string,
): YearlyReport {
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const spentByMonth = fillMonths(months, spent);
  const incomeByMonth = fillMonths(months, income);
  const rows = months.map((month, i) => {
    const spentCents = spentByMonth[i].cents;
    const incomeCents = incomeByMonth[i].cents;
    return { month, spentCents, incomeCents, netCents: incomeCents - spentCents };
  });
  const started = rows.filter((r) => r.month <= throughMonth);
  const spentCents = sumCents(rows.map((r) => r.spentCents));
  const incomeCents = sumCents(rows.map((r) => r.incomeCents));
  return {
    rows,
    spentCents,
    incomeCents,
    netCents: incomeCents - spentCents,
    averageSpentCents:
      started.length > 0
        ? Math.round(sumCents(started.map((r) => r.spentCents)) / started.length)
        : null,
  };
}
