"use client";

import { useLocale } from "next-intl";
import { currencySymbol } from "@/lib/format";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

/** Amount field with the account currency's symbol in front. Submits plain text like "12.50". */
export function MoneyInput({
  currency,
  className,
  ...props
}: React.ComponentProps<"input"> & { currency: string }) {
  const locale = useLocale();
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <InputGroupText>{currencySymbol(currency, locale)}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0)}
        className="tabular-nums"
        {...props}
      />
    </InputGroup>
  );
}
