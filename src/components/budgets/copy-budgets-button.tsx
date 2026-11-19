"use client";

import { useTransition } from "react";
import { CopyPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { copyPreviousBudgetsAction } from "@/server/budget-actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function CopyBudgetsButton({
  month,
  variant = "outline",
}: {
  month: string;
  variant?: "default" | "outline";
}) {
  const t = useTranslations("budgets");
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const { copied } = await copyPreviousBudgetsAction(month);
          toast.success(t("copied", { count: copied }));
        })
      }
    >
      {pending ? <Spinner /> : <CopyPlus />}
      {t("copyAction")}
    </Button>
  );
}
