"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "./category-dot";

const ALL = "all";

/**
 * Search, category filter and CSV export above an entry table. State lives in
 * the URL; typing updates it after a short pause, and any change resets to
 * page 1.
 */
export function ListToolbar({
  q,
  category,
  withCategory = false,
  exportHref,
  summary,
}: {
  q: string;
  category?: string;
  withCategory?: boolean;
  exportHref?: string;
  /** Count and total for the current filters, shown on the right. */
  summary?: React.ReactNode;
}) {
  const t = useTranslations("entries");
  const tc = useTranslations("categories");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The box follows the URL when it changes from outside (e.g. "Clear filters"),
  // but not when the change is our own debounced push catching up with typing.
  const [value, setValue] = useState(q);
  const [pushed, setPushed] = useState(q);
  const [seenQ, setSeenQ] = useState(q);
  if (q !== seenQ) {
    setSeenQ(q);
    if (q !== pushed) {
      setValue(q);
      setPushed(q);
    }
  }

  function navigate(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(params);
    for (const [key, v] of Object.entries(changes)) {
      if (v) next.set(key, v);
      else next.delete(key);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSearch(text: string) {
    setValue(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = text.trim();
      setPushed(trimmed);
      navigate({ q: trimmed || undefined });
    }, 300);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="w-full sm:w-64">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          value={value}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          maxLength={100}
        />
      </InputGroup>
      {withCategory ? (
        <Select
          value={category ?? ALL}
          onValueChange={(v) => navigate({ category: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-44" aria-label={t("filterCategory")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("allCategories")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                <CategoryDot category={c} />
                {tc(c)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {summary}
        {exportHref ? (
          <Button asChild variant="outline" size="sm">
            <a href={exportHref} download>
              <Download />
              {t("exportCsv")}
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
