"use client";

import { startTransition, useActionState, useOptimistic, useRef, useTransition } from "react";
import { ListChecks, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "cn";
import { useMessage } from "@/i18n/use-message";
import type { ShoppingItem } from "@/server/shopping";
import {
  addShoppingItemAction,
  clearCompletedShoppingAction,
  deleteShoppingItemAction,
  setShoppingItemDoneAction,
  type ShoppingFormState,
} from "@/server/shopping-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type Change =
  | { type: "add"; item: ShoppingItem }
  | { type: "toggle"; id: string; done: boolean }
  | { type: "delete"; id: string }
  | { type: "clear" };

function apply(items: ShoppingItem[], change: Change): ShoppingItem[] {
  switch (change.type) {
    case "add":
      return [change.item, ...items];
    case "toggle":
      return items.map((i) => (i.id === change.id ? { ...i, done: change.done } : i));
    case "delete":
      return items.filter((i) => i.id !== change.id);
    case "clear":
      return items.filter((i) => !i.done);
  }
}

/**
 * The list updates the moment you act (optimistically) and settles when the
 * server confirms. To-buy items first, bought items after, struck through.
 */
export function ShoppingList({ items }: { items: ShoppingItem[] }) {
  const t = useTranslations("shopping");
  const message = useMessage();
  const [optimistic, change] = useOptimistic(items, apply);
  const [clearing, startClear] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, add, adding] = useActionState(
    async (prev: ShoppingFormState, formData: FormData) => {
      const name = String(formData.get("name") ?? "").trim();
      if (name) change({ type: "add", item: { id: `pending-${Date.now()}`, name, done: false } });
      const result = await addShoppingItemAction(prev, formData);
      if (result?.ok && inputRef.current) inputRef.current.value = "";
      return result;
    },
    undefined,
  );
  const error = state?.fieldErrors?.name;

  const open = optimistic.filter((i) => !i.done);
  const done = optimistic.filter((i) => i.done);

  function toggle(item: ShoppingItem, checked: boolean) {
    startTransition(async () => {
      change({ type: "toggle", id: item.id, done: checked });
      await setShoppingItemDoneAction(item.id, checked);
    });
  }

  function remove(item: ShoppingItem) {
    startTransition(async () => {
      change({ type: "delete", id: item.id });
      await deleteShoppingItemAction(item.id);
    });
  }

  function clearCompleted() {
    startClear(async () => {
      change({ type: "clear" });
      const { cleared } = await clearCompletedShoppingAction();
      toast.success(t("cleared", { count: cleared }));
    });
  }

  const row = (item: ShoppingItem) => {
    const pending = item.id.startsWith("pending-");
    const id = `item-${item.id}`;
    return (
      <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5 sm:px-5">
        <Checkbox
          id={id}
          checked={item.done}
          disabled={pending}
          onCheckedChange={(checked) => toggle(item, checked === true)}
        />
        <label
          htmlFor={id}
          className={cn(
            "min-w-0 flex-1 cursor-pointer truncate py-0.5",
            item.done && "text-muted-foreground decoration-muted-foreground/60 line-through",
            pending && "text-muted-foreground",
          )}
        >
          {item.name}
        </label>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={pending}
          onClick={() => remove(item)}
          aria-label={t("deleteItem", { name: item.name })}
          className="text-muted-foreground opacity-100 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0"
        >
          <X />
        </Button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          startTransition(() => add(formData));
        }}
      >
        <Field data-invalid={!!error || undefined}>
          <label htmlFor="shopping-name" className="sr-only">
            {t("addLabel")}
          </label>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              id="shopping-name"
              name="name"
              placeholder={t("addPlaceholder")}
              maxLength={80}
              autoComplete="off"
              autoFocus
              aria-invalid={!!error || undefined}
              aria-describedby={error ? "shopping-name-error" : undefined}
            />
            <Button type="submit" disabled={adding}>
              {adding ? <Spinner /> : <Plus />}
              {t("add")}
            </Button>
          </div>
          {error ? <FieldError id="shopping-name-error">{message(error)}</FieldError> : null}
        </Field>
      </form>

      {optimistic.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-12 text-center">
          <ListChecks className="text-muted-foreground size-5" aria-hidden />
          <p className="font-medium">{t("emptyTitle")}</p>
          <p className="text-muted-foreground max-w-xs text-sm text-balance">{t("emptyBody")}</p>
        </div>
      ) : (
        <>
          <section aria-labelledby="to-buy" className="bg-card rounded-xl border">
            <header className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
              <h2 id="to-buy" className="font-semibold">
                {t("toBuy")}
              </h2>
              <p className="text-muted-foreground text-sm" aria-live="polite">
                {t("remaining", { count: open.length })}
              </p>
            </header>
            {open.length > 0 ? (
              <ul className="divide-y">{open.map(row)}</ul>
            ) : (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm sm:px-5">
                {t("allBought")}
              </p>
            )}
          </section>

          {done.length > 0 ? (
            <section aria-labelledby="bought" className="bg-card rounded-xl border">
              <header className="flex items-center justify-between border-b px-4 py-2 sm:px-5">
                <h2 id="bought" className="font-semibold">
                  {t("completedHeading")}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  disabled={clearing}
                  onClick={clearCompleted}
                >
                  {t("clearCompleted", { count: done.length })}
                </Button>
              </header>
              <ul className="divide-y">{done.map(row)}</ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
