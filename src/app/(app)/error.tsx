"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

/** Error boundary for app pages: the shell stays, the page offers a retry. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Empty className="max-w-md">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleAlert />
          </EmptyMedia>
          <EmptyTitle>{t("errors.title")}</EmptyTitle>
          <EmptyDescription>{t("errors.body")}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={reset}>{t("common.retry")}</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
