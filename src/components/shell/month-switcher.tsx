"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { monthRange, shiftMonth } from "@/lib/dates";
import { Button } from "@/components/ui/button";

/** Previous / current / next month control. The month lives in the URL (?month=YYYY-MM). */
export function MonthSwitcher({ month, currentMonth }: { month: string; currentMonth: string }) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const pathname = usePathname();
  const params = useSearchParams();

  const hrefFor = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === currentMonth) next.delete("month");
    else next.set("month", key);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const raw = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthRange(month).start);
  // Sentence case: "octubre de 2026" -> "Octubre de 2026" (CSS capitalize would hit every word).
  const label = raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1);

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("previousMonth")}>
        <Link href={hrefFor(shiftMonth(month, -1))} scroll={false}>
          <ChevronLeft />
        </Link>
      </Button>
      <span className="min-w-36 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {label}
      </span>
      <Button asChild variant="ghost" size="icon-sm" aria-label={t("nextMonth")}>
        <Link href={hrefFor(shiftMonth(month, 1))} scroll={false}>
          <ChevronRight />
        </Link>
      </Button>
      {month !== currentMonth ? (
        <Button asChild variant="outline" size="sm" className="ml-1 hidden sm:inline-flex">
          <Link href={hrefFor(currentMonth)} scroll={false}>
            {t("thisMonth")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
