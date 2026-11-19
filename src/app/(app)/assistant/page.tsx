import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { assistantConfig } from "@/server/assistant";
import { AssistantChat } from "@/components/assistant/chat";
import { PageHeader } from "@/components/shell/page-header";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("assistant");
  return { title: t("title") };
}

export default async function AssistantPage() {
  await requireUser();
  const t = await getTranslations("assistant");
  const configured = assistantConfig() !== null;

  return (
    <>
      <PageHeader title={t("title")} />
      {configured ? (
        <AssistantChat suggestions={[t("suggestion1"), t("suggestion2"), t("suggestion3")]} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-6">
          <Empty className="max-w-md">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRound />
              </EmptyMedia>
              <EmptyTitle>{t("notConfiguredTitle")}</EmptyTitle>
              <EmptyDescription>{t("notConfiguredBody")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      )}
    </>
  );
}
