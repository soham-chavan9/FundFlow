import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ReceiptText, SearchX } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { toMonthKey } from "@/lib/dates";
import { formatDay, formatMonth } from "@/lib/format";
import { listHref, parseListState } from "@/lib/list-params";
import { formatMoney } from "@/lib/money";
import { listExpenses } from "@/server/ledger";
import { AddEntryButton } from "@/components/entries/add-entry-button";
import { CategoryDot } from "@/components/entries/category-dot";
import { EntryRowActions } from "@/components/entries/entry-row-actions";
import { ListPagination, SortHeader } from "@/components/entries/list-table-parts";
import { ListToolbar } from "@/components/entries/list-toolbar";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("expenses");
  return { title: t("title") };
}

const BASE = "/expenses";

export default async function ExpensesPage({ searchParams }: PageProps<"/expenses">) {
  const user = await requireUser();
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);
  const now = new Date();
  const currentMonth = toMonthKey(now);
  const state = parseListState(await searchParams, now);
  const data = await listExpenses(user.id, state);
  const filtered = Boolean(state.q || state.category);
  const money = (cents: number) => formatMoney(cents, user.currency, locale);
  const links = { base: BASE, state, currentMonth };

  return (
    <>
      <PageHeader title={t("expenses.title")}>
        <Suspense>
          <MonthSwitcher month={state.month} currentMonth={currentMonth} />
        </Suspense>
        <AddEntryButton currency={user.currency} />
      </PageHeader>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
        <Suspense>
          <ListToolbar
            q={state.q}
            category={state.category}
            withCategory
            exportHref={
              data.count > 0
                ? listHref(`${BASE}/export`, { ...state, page: 1 }, currentMonth)
                : undefined
            }
            summary={
              data.count > 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t("expenses.count", { count: data.count })}
                  <span aria-hidden> · </span>
                  <span className="text-foreground font-medium tabular-nums">
                    {money(data.totalCents)}
                  </span>
                </p>
              ) : null
            }
          />
        </Suspense>

        {data.count === 0 ? (
          <Empty className="flex-1 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">{filtered ? <SearchX /> : <ReceiptText />}</EmptyMedia>
              <EmptyTitle>
                {filtered
                  ? t("expenses.noMatchTitle")
                  : t("expenses.emptyTitle", { month: formatMonth(state.month, locale) })}
              </EmptyTitle>
              <EmptyDescription>
                {filtered ? t("entries.noMatchBody") : t("expenses.emptyBody")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {filtered ? (
                <Button asChild variant="outline">
                  <Link href={listHref(BASE, { month: state.month }, currentMonth)}>
                    {t("entries.clearFilters")}
                  </Link>
                </Button>
              ) : (
                <AddEntryButton currency={user.currency} variant="inline" />
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="bg-card overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortHeader
                      {...links}
                      sortKey="date"
                      label={t("entries.date")}
                      className="w-16 pl-4 sm:w-24"
                    />
                    <TableHead>{t("expenses.labelField")}</TableHead>
                    <TableHead className="hidden w-44 md:table-cell">
                      {t("entries.category")}
                    </TableHead>
                    <SortHeader
                      {...links}
                      sortKey="amount"
                      label={t("entries.amount")}
                      className="w-24 text-right sm:w-32"
                    />
                    <TableHead className="w-10 pr-2 sm:w-12 sm:pr-4">
                      <span className="sr-only">{t("entries.actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground pl-4 align-top tabular-nums">
                        {formatDay(row.date, locale)}
                      </TableCell>
                      <TableCell className="max-w-0 align-top whitespace-normal">
                        <p className="truncate font-medium">{row.title}</p>
                        <p className="text-muted-foreground flex items-center gap-1.5 text-xs md:hidden">
                          <CategoryDot category={row.category} />
                          {t(`categories.${row.category}`)}
                        </p>
                        {row.notes ? (
                          <p className="text-muted-foreground truncate text-xs">{row.notes}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden align-top md:table-cell">
                        <span className="inline-flex items-center gap-2">
                          <CategoryDot category={row.category} />
                          {t(`categories.${row.category}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right align-top font-medium tabular-nums">
                        {money(row.amountCents)}
                      </TableCell>
                      <TableCell className="pr-2 text-right align-top sm:pr-4">
                        <EntryRowActions kind="expense" entry={row} currency={user.currency} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ListPagination {...links} page={data.page} pageCount={data.pageCount} />
          </>
        )}
      </div>
    </>
  );
}
