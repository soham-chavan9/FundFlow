"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatMoney, type Currency } from "@/lib/money";
import type { EntryKind, ExpenseRow, IncomeRow } from "@/lib/entry-types";
import { deleteExpenseAction } from "@/server/expense-actions";
import { deleteIncomeAction } from "@/server/income-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntryDialog } from "./entry-dialog";

export function EntryRowActions({
  kind,
  entry,
  currency,
}: {
  kind: EntryKind;
  entry: ExpenseRow | IncomeRow;
  currency: Currency;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ns = kind === "expense" ? "expenses" : "income";
  const name = "title" in entry ? entry.title : entry.source;

  function confirmDelete() {
    setDeleteOpen(false);
    startTransition(async () => {
      const remove = kind === "expense" ? deleteExpenseAction : deleteIncomeAction;
      const { ok } = await remove(entry.id);
      if (ok) toast.success(t(`${ns}.deleted`));
      else toast.error(t("entries.notFound"));
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={t("entries.moreActions", { name })}
            className="text-muted-foreground data-[state=open]:text-foreground"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EntryDialog
        kind={kind}
        currency={currency}
        entry={entry}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`${ns}.deleteTitle`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("entries.deleteBody", {
                name,
                amount: formatMoney(entry.amountCents, currency, locale),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
