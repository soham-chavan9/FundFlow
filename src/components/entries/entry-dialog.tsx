"use client";

import { startTransition, useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/categories";
import { formatMonth } from "@/lib/format";
import { centsToInput, decimalSeparator, formatMoney, type Currency } from "@/lib/money";
import type { EntryFormState, EntryKind, ExpenseRow, IncomeRow } from "@/lib/entry-types";
import { useMessage } from "@/i18n/use-message";
import { saveExpenseAction } from "@/server/expense-actions";
import { saveIncomeAction } from "@/server/income-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { CategoryDot } from "./category-dot";
import { MoneyInput } from "./money-input";

type Entry = ExpenseRow | IncomeRow;

interface EntryDialogProps {
  kind: EntryKind;
  currency: Currency;
  /** Present when editing. */
  entry?: Entry;
  /** Uncontrolled use: the button that opens the dialog. */
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Add or edit an expense or income entry. The form remounts on every open, so it starts clean. */
export function EntryDialog({
  kind,
  currency,
  entry,
  trigger,
  open,
  onOpenChange,
}: EntryDialogProps) {
  const t = useTranslations(kind === "expense" ? "expenses" : "income");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md" closeLabel={tCommon("close")}>
        <DialogHeader>
          <DialogTitle>{entry ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        <EntryForm kind={kind} currency={currency} entry={entry} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function todayInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function EntryForm({
  kind,
  currency,
  entry,
  onDone,
}: {
  kind: EntryKind;
  currency: Currency;
  entry?: Entry;
  onDone: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const message = useMessage();
  const [today] = useState(todayInput);
  const ns = kind === "expense" ? "expenses" : "income";

  const [state, action, pending] = useActionState(
    async (prev: EntryFormState, formData: FormData) => {
      const save = kind === "expense" ? saveExpenseAction : saveIncomeAction;
      const result = await save(prev, formData);
      if (result?.ok) {
        onDone();
        const done = t(entry ? `${ns}.updated` : `${ns}.added`);
        if (result.overspend) {
          const o = result.overspend;
          toast.warning(
            t("budgets.overspendTitle", {
              category: t(`categories.${o.category}`),
              amount: formatMoney(o.overByCents, currency, locale),
            }),
            {
              description: t("budgets.overspendBody", {
                done,
                month: formatMonth(o.month, locale),
                limit: formatMoney(o.limitCents, currency, locale),
              }),
              action: {
                label: t("budgets.view"),
                onClick: () => router.push(`/budgets?month=${o.month}`),
              },
            },
          );
        } else {
          toast.success(done);
        }
      }
      return result;
    },
    undefined,
  );
  const err = state?.fieldErrors ?? {};
  const expense = kind === "expense" ? (entry as ExpenseRow | undefined) : undefined;
  const income = kind === "income" ? (entry as IncomeRow | undefined) : undefined;
  const labelField = kind === "expense" ? "title" : "source";

  const fieldProps = (name: string) => ({
    id: `entry-${name}`,
    name,
    "aria-invalid": !!err[name] || undefined,
    "aria-describedby": err[name] ? `entry-${name}-error` : undefined,
  });
  const fieldError = (name: string) =>
    err[name] ? <FieldError id={`entry-${name}-error`}>{message(err[name])}</FieldError> : null;

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      // Dispatch by hand instead of <form action>: React resets a form after an
      // action, which would wipe what was typed when validation fails.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      {state?.formError ? (
        <Alert variant="destructive" aria-live="polite">
          <AlertCircle />
          <AlertDescription>{message(state.formError)}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup className="gap-5">
        <Field data-invalid={!!err[labelField] || undefined}>
          <FieldLabel htmlFor={`entry-${labelField}`}>{t(`${ns}.labelField`)}</FieldLabel>
          <Input
            {...fieldProps(labelField)}
            defaultValue={expense?.title ?? income?.source}
            placeholder={t(`${ns}.labelPlaceholder`)}
            maxLength={80}
            autoComplete="off"
            autoFocus
            required
          />
          {fieldError(labelField)}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
          <Field data-invalid={!!err.amount || undefined}>
            <FieldLabel htmlFor="entry-amount">{t("entries.amount")}</FieldLabel>
            <MoneyInput
              currency={currency}
              {...fieldProps("amount")}
              defaultValue={
                entry ? centsToInput(entry.amountCents, decimalSeparator(locale)) : undefined
              }
              required
            />
            {fieldError("amount")}
          </Field>
          <Field data-invalid={!!err.date || undefined}>
            <FieldLabel htmlFor="entry-date">{t("entries.date")}</FieldLabel>
            <Input
              type="date"
              {...fieldProps("date")}
              defaultValue={entry?.date ?? today}
              className="tabular-nums"
              required
            />
            {fieldError("date")}
          </Field>
        </div>
        {kind === "expense" ? (
          <Field data-invalid={!!err.category || undefined}>
            <FieldLabel htmlFor="entry-category">{t("entries.category")}</FieldLabel>
            <Select name="category" defaultValue={expense?.category} required>
              <SelectTrigger
                id="entry-category"
                className="w-full"
                aria-invalid={!!err.category || undefined}
                aria-describedby={err.category ? "entry-category-error" : undefined}
              >
                <SelectValue placeholder={t("entries.chooseCategory")} />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    <CategoryDot category={c} />
                    {t(`categories.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError("category")}
          </Field>
        ) : null}
        <Field data-invalid={!!err.notes || undefined}>
          <FieldLabel htmlFor="entry-notes">
            {t("entries.notes")}{" "}
            <span className="text-muted-foreground font-normal">{t("entries.optional")}</span>
          </FieldLabel>
          <Textarea
            {...fieldProps("notes")}
            defaultValue={entry?.notes ?? undefined}
            maxLength={500}
            rows={2}
            className="min-h-16 resize-none"
          />
          {fieldError("notes")}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t("common.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Spinner /> {t("entries.saving")}
            </>
          ) : entry ? (
            t("common.save")
          ) : (
            t(`${ns}.addTitle`)
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
