"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Currency } from "@/lib/money";
import type { EntryKind } from "@/lib/entry-types";
import { Button } from "@/components/ui/button";
import { EntryDialog } from "./entry-dialog";

/**
 * The one primary action in a page header. Opens the add dialog in place, so
 * adding an expense is one step from any screen. Icon-only on phones.
 */
export function AddEntryButton({
  kind = "expense",
  currency,
  variant = "header",
}: {
  kind?: EntryKind;
  currency: Currency;
  /** `header`: compact, icon-only on phones. `inline`: full label, for empty states. */
  variant?: "header" | "inline";
}) {
  const t = useTranslations(kind === "expense" ? "expenses" : "income");
  const label = t("addTitle");
  return (
    <EntryDialog
      kind={kind}
      currency={currency}
      trigger={
        variant === "header" ? (
          <Button size="sm" aria-label={label} className="max-sm:size-8 max-sm:px-0">
            <Plus />
            <span className="max-sm:sr-only">{label}</span>
          </Button>
        ) : (
          <Button>
            <Plus />
            {label}
          </Button>
        )
      }
    />
  );
}
