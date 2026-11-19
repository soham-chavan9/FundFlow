"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useLocale } from "next-intl";
import { enUS, es, zhCN } from "react-day-picker/locale";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PICKER_LOCALES = { en: enUS, es, zh: zhCN } as const;

function parse(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * A calendar-day picker that matches the other fields: the chosen date shows
 * in the reader's own format ("Nov 19, 2026", "19 nov 2026", "2026年11月19日")
 * and submits as `YYYY-MM-DD` through a hidden input.
 */
export function DateField({
  id,
  name,
  defaultValue,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  /** `YYYY-MM-DD` */
  defaultValue: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const locale = useLocale();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const date = parse(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(
            "dark:bg-input/30 h-8 w-full justify-start px-2.5 font-normal tabular-nums",
          )}
        >
          <CalendarDays className="text-muted-foreground" />
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          locale={PICKER_LOCALES[locale as keyof typeof PICKER_LOCALES] ?? enUS}
          onSelect={(next) => {
            if (next) {
              setValue(toValue(next));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
      <input type="hidden" name={name} value={value} />
    </Popover>
  );
}
