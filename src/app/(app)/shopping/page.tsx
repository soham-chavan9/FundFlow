import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/lib/auth/dal";
import { listShoppingItems } from "@/server/shopping";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { PageHeader } from "@/components/shell/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shopping");
  return { title: t("title") };
}

export default async function ShoppingPage() {
  const user = await requireUser();
  const t = await getTranslations("shopping");
  const items = await listShoppingItems(user.id);

  return (
    <>
      <PageHeader title={t("title")} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4 sm:p-6">
        <ShoppingList items={items} />
      </div>
    </>
  );
}
