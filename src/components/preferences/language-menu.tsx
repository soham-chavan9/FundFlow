"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LOCALES } from "@/i18n/locales";
import { setLocaleAction } from "@/server/preferences";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Standalone language picker for signed-out pages. */
export function LanguageMenu() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending} aria-label={t("shell.language")}>
          <Languages />
          <span className="max-sm:sr-only">{t(`languages.${locale}`)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            lang={l}
            onSelect={() =>
              startTransition(async () => {
                await setLocaleAction(l);
                router.refresh();
              })
            }
          >
            {t(`languages.${l}`)}
            {l === locale ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
