"use client";

import { useTranslations } from "next-intl";

type Key = Parameters<ReturnType<typeof useTranslations<never>>>[0];

/**
 * Translates an i18n key that arrived at runtime (e.g. a validation error
 * key from a Server Action). Unknown keys fall back to a generic message
 * instead of showing the raw key.
 */
export function useMessage() {
  const t = useTranslations();
  return (key: string | undefined) => {
    if (!key) return undefined;
    return t.has(key as Key) ? t(key as Key) : t("common.genericError");
  };
}
