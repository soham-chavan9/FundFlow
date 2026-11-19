import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Sticky top bar of the content plane: sidebar toggle, page title, then the
 * page's own controls (month switcher, primary action) on the right.
 */
export async function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const t = await getTranslations("shell");
  return (
    <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-5 md:rounded-t-xl">
      <SidebarTrigger className="-ml-1" label={t("toggleSidebar")} />
      <Separator orientation="vertical" className="mr-1 h-4 data-vertical:self-center" />
      <h1 className="truncate text-[15px] font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
