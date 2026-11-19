import "server-only";
import { ObjectId, type Collection, type Filter, type Sort } from "mongodb";
import { collections } from "@/lib/db";
import { isCategory, type Category } from "@/lib/categories";
import { monthRange, toDateInput } from "@/lib/dates";
import {
  emptyCategoryTotals,
  fillMonths,
  type BudgetMap,
  type CategoryTotals,
  type MonthTotal,
} from "@/lib/finance";
import type { ExpenseDoc, IncomeDoc } from "@/lib/types";
import type { ExpenseRow, IncomeRow, SortDir, SortKey } from "@/lib/entry-types";

/**
 * Read side of the ledger. Every function takes the signed-in user's id (from
 * the DAL, never from the client) and filters on it.
 */

export const PAGE_SIZE = 20;

export interface ListParams {
  month: string;
  q?: string;
  category?: Category;
  sort: SortKey;
  dir: SortDir;
  page: number;
}

export interface EntryPage<T> {
  rows: T[];
  /** Entries matching the filters, across all pages. */
  count: number;
  /** Sum of amounts matching the filters, across all pages. */
  totalCents: number;
  page: number;
  pageCount: number;
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toExpenseRow(d: ExpenseDoc): ExpenseRow {
  return {
    id: d._id.toHexString(),
    title: d.title,
    category: d.category,
    amountCents: d.amountCents,
    date: toDateInput(d.date),
    notes: d.notes ?? null,
  };
}

function toIncomeRow(d: IncomeDoc): IncomeRow {
  return {
    id: d._id.toHexString(),
    source: d.source,
    amountCents: d.amountCents,
    date: toDateInput(d.date),
    notes: d.notes ?? null,
  };
}

function sortFor(sort: SortKey, dir: SortDir): Sort {
  const d = dir === "asc" ? 1 : -1;
  return sort === "amount"
    ? { amountCents: d, date: -1, _id: -1 }
    : { date: d, createdAt: d, _id: d };
}

function monthFilter(userId: string, month: string) {
  const { start, end } = monthRange(month);
  return { userId: new ObjectId(userId), date: { $gte: start, $lt: end } };
}

async function countAndSum<T extends ExpenseDoc | IncomeDoc>(
  collection: Collection<T>,
  filter: Filter<T>,
) {
  const [agg] = await collection
    .aggregate<{ count: number; totalCents: number }>([
      { $match: filter },
      { $group: { _id: null, count: { $sum: 1 }, totalCents: { $sum: "$amountCents" } } },
    ])
    .toArray();
  return { count: agg?.count ?? 0, totalCents: agg?.totalCents ?? 0 };
}

function pageBounds(count: number, requested: number) {
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const page = Math.min(Math.max(1, Math.trunc(requested) || 1), pageCount);
  return { page, pageCount };
}

export function expenseFilter(userId: string, p: Omit<ListParams, "sort" | "dir" | "page">) {
  const filter: Filter<ExpenseDoc> = monthFilter(userId, p.month);
  if (p.category) filter.category = p.category;
  if (p.q) {
    const re = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [{ title: re }, { notes: re }];
  }
  return filter;
}

export async function listExpenses(userId: string, p: ListParams): Promise<EntryPage<ExpenseRow>> {
  const { expenses } = await collections();
  const filter = expenseFilter(userId, p);
  const { count, totalCents } = await countAndSum(expenses, filter);
  const { page, pageCount } = pageBounds(count, p.page);
  const docs = await expenses
    .find(filter)
    .sort(sortFor(p.sort, p.dir))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();
  return { rows: docs.map(toExpenseRow), count, totalCents, page, pageCount };
}

/** Every expense matching the filters, for CSV export. Capped as a guard. */
export async function allExpenses(
  userId: string,
  p: Omit<ListParams, "page">,
): Promise<ExpenseRow[]> {
  const { expenses } = await collections();
  const docs = await expenses
    .find(expenseFilter(userId, p))
    .sort(sortFor(p.sort, p.dir))
    .limit(10_000)
    .toArray();
  return docs.map(toExpenseRow);
}

export function incomeFilter(userId: string, p: Pick<ListParams, "month" | "q">) {
  const filter: Filter<IncomeDoc> = monthFilter(userId, p.month);
  if (p.q) {
    const re = new RegExp(escapeRegex(p.q), "i");
    filter.$or = [{ source: re }, { notes: re }];
  }
  return filter;
}

export async function listIncome(
  userId: string,
  p: Omit<ListParams, "category">,
): Promise<EntryPage<IncomeRow>> {
  const { incomes } = await collections();
  const filter = incomeFilter(userId, p);
  const { count, totalCents } = await countAndSum(incomes, filter);
  const { page, pageCount } = pageBounds(count, p.page);
  const docs = await incomes
    .find(filter)
    .sort(sortFor(p.sort, p.dir))
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .toArray();
  return { rows: docs.map(toIncomeRow), count, totalCents, page, pageCount };
}

export async function recentExpenses(userId: string, month: string, limit = 6) {
  const { expenses } = await collections();
  const docs = await expenses
    .find(monthFilter(userId, month))
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray();
  return docs.map(toExpenseRow);
}

export async function categoryTotals(userId: string, month: string): Promise<CategoryTotals> {
  const { expenses } = await collections();
  const rows = await expenses
    .aggregate<{ _id: string; cents: number }>([
      { $match: monthFilter(userId, month) },
      { $group: { _id: "$category", cents: { $sum: "$amountCents" } } },
    ])
    .toArray();
  const totals = emptyCategoryTotals();
  for (const r of rows) if (isCategory(r._id)) totals[r._id] = r.cents;
  return totals;
}

/** Sum per month over a run of consecutive month keys, zero-filled. */
export async function monthlyTotals(
  userId: string,
  kind: "expenses" | "incomes",
  months: string[],
): Promise<MonthTotal[]> {
  if (months.length === 0) return [];
  const db = await collections();
  const start = monthRange(months[0]).start;
  const end = monthRange(months[months.length - 1]).end;
  const rows = await db[kind]
    .aggregate<{ _id: string; cents: number }>([
      { $match: { userId: new ObjectId(userId), date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$date", timezone: "UTC" } },
          cents: { $sum: "$amountCents" },
        },
      },
    ])
    .toArray();
  return fillMonths(
    months,
    rows.map((r) => ({ month: r._id, cents: r.cents })),
  );
}

export async function getBudgets(userId: string, month: string): Promise<BudgetMap> {
  const { budgets } = await collections();
  const docs = await budgets.find({ userId: new ObjectId(userId), month }).toArray();
  const map: BudgetMap = {};
  for (const b of docs) if (isCategory(b.category)) map[b.category] = b.limitCents;
  return map;
}

/** Whether the account has recorded anything at all, to tell first-run apart from a quiet month. */
export async function hasAnyActivity(userId: string): Promise<boolean> {
  const { expenses, incomes, budgets } = await collections();
  const id = new ObjectId(userId);
  const found = await Promise.all([
    expenses.findOne({ userId: id }, { projection: { _id: 1 } }),
    incomes.findOne({ userId: id }, { projection: { _id: 1 } }),
    budgets.findOne({ userId: id }, { projection: { _id: 1 } }),
  ]);
  return found.some(Boolean);
}
