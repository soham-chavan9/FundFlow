"use client";

import { startTransition, useActionState, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Category } from "@/lib/categories";
import { centsToInput, decimalSeparator, type Currency } from "@/lib/money";
import { useMessage } from "@/i18n/use-message";
import { removeBudgetAction, setBudgetAction, type BudgetFormState } from "@/server/budget-actions";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { MoneyInput } from "@/components/entries/money-input";

/** Set, change or remove one category's monthly limit, in a popover next to its row. */
export function BudgetEditor({
  month,
  category,
  limitCents,
  currency,
}: {
  month: string;
  category: Category;
  limitCents?: number;
  currency: Currency;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const name = t(`categories.${category}`);
  const label = limitCents === undefined ? t("budgets.set") : t("common.edit");
  const ariaLabel =
    limitCents === undefined
      ? t("budgets.setFor", { category: name })
      : t("budgets.editFor", { category: name });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={limitCents === undefined ? "outline" : "ghost"}
          size="sm"
          aria-label={ariaLabel}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <BudgetForm
          month={month}
          category={category}
          limitCents={limitCents}
          currency={currency}
          onDone={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

function BudgetForm({
  month,
  category,
  limitCents,
  currency,
  onDone,
}: {
  month: string;
  category: Category;
  limitCents?: number;
  currency: Currency;
  onDone: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const message = useMessage();
  const [removing, startRemove] = useTransition();
  const [state, action, pending] = useActionState(
    async (prev: BudgetFormState, formData: FormData) => {
      const result = await setBudgetAction(prev, formData);
      if (result?.ok) {
        onDone();
        toast.success(t("budgets.saved", { category: t(`categories.${category}`) }));
      }
      return result;
    },
    undefined,
  );
  const error = state?.fieldErrors?.limit ?? state?.formError;
  const id = `budget-${category}`;

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
    >
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="category" value={category} />
      <Field data-invalid={!!error || undefined}>
        <FieldLabel htmlFor={id}>
          {t("budgets.limitFor", { category: t(`categories.${category}`) })}
        </FieldLabel>
        <MoneyInput
          id={id}
          name="limit"
          currency={currency}
          defaultValue={
            limitCents === undefined
              ? undefined
              : centsToInput(limitCents, decimalSeparator(locale))
          }
          autoFocus
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {error ? <FieldError id={`${id}-error`}>{message(error)}</FieldError> : null}
      </Field>
      <div className="flex items-center justify-between gap-2">
        {limitCents !== undefined ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive -ml-2"
            disabled={removing || pending}
            onClick={() =>
              startRemove(async () => {
                const { ok } = await removeBudgetAction(month, category);
                if (ok) {
                  onDone();
                  toast.success(t("budgets.removed", { category: t(`categories.${category}`) }));
                }
              })
            }
          >
            {t("budgets.remove")}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={pending || removing}>
          {pending ? <Spinner /> : null}
          {t("common.save")}
        </Button>
      </div>
    </form>
  );
}
