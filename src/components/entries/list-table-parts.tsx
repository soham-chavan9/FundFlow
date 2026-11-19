import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { cn } from "cn";
import { listHref, type ListState } from "@/lib/list-params";
import type { SortKey } from "@/lib/entry-types";
import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";

interface LinkContext {
  base: string;
  state: ListState;
  currentMonth: string;
}

/** A column header that sorts the list. Click again to flip the direction. */
export function SortHeader({
  label,
  sortKey,
  base,
  state,
  currentMonth,
  className,
}: LinkContext & { label: string; sortKey: SortKey; className?: string }) {
  const active = state.sort === sortKey;
  const nextDir = active && state.dir === "desc" ? "asc" : "desc";
  const Arrow = state.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead
      aria-sort={active ? (state.dir === "asc" ? "ascending" : "descending") : "none"}
      className={className}
    >
      <Link
        href={listHref(base, { ...state, sort: sortKey, dir: nextDir, page: 1 }, currentMonth)}
        scroll={false}
        className={cn(
          "hover:text-foreground focus-visible:ring-ring/50 -mx-1 inline-flex items-center gap-1 rounded px-1 outline-none focus-visible:ring-3",
          className?.includes("text-right") && "flex-row-reverse",
          active && "text-foreground",
        )}
      >
        {label}
        <Arrow aria-hidden className={cn("size-3.5", !active && "invisible")} />
      </Link>
    </TableHead>
  );
}

export async function ListPagination({
  base,
  state,
  currentMonth,
  page,
  pageCount,
}: LinkContext & { page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const t = await getTranslations("entries");
  const link = (p: number) => listHref(base, { ...state, page: p }, currentMonth);
  return (
    <nav aria-label={t("pagination")} className="flex items-center justify-end gap-2">
      <span className="text-muted-foreground mr-2 text-sm tabular-nums">
        {t("pageOf", { page, pageCount })}
      </span>
      {page > 1 ? (
        <Button asChild variant="outline" size="icon-sm" aria-label={t("previousPage")}>
          <Link href={link(page - 1)} scroll={false}>
            <ChevronLeft />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label={t("previousPage")}>
          <ChevronLeft />
        </Button>
      )}
      {page < pageCount ? (
        <Button asChild variant="outline" size="icon-sm" aria-label={t("nextPage")}>
          <Link href={link(page + 1)} scroll={false}>
            <ChevronRight />
          </Link>
        </Button>
      ) : (
        <Button variant="outline" size="icon-sm" disabled aria-label={t("nextPage")}>
          <ChevronRight />
        </Button>
      )}
    </nav>
  );
}
