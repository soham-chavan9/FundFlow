import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, ReceiptText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { toMonthKey } from "@/lib/dates";
import { resolveMonth } from "@/lib/month-param";
import { MonthSwitcher } from "@/components/shell/month-switcher";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  await requireUser();
  const t = await getTranslations();
  const month = resolveMonth((await searchParams).month);

  return (
    <>
      <PageHeader title={t("dashboard.title")}>
        <Suspense>
          <MonthSwitcher month={month} currentMonth={toMonthKey(new Date())} />
        </Suspense>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/expenses?new=1">
            <Plus />
            {t("shell.addExpense")}
          </Link>
        </Button>
      </PageHeader>
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty className="max-w-md">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>{t("dashboard.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("dashboard.emptyBody")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center gap-2">
            <Button asChild>
              <Link href="/expenses?new=1">
                <Plus />
                {t("shell.addExpense")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/budgets">{t("dashboard.setBudget")}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </>
  );
}
